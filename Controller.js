/* global THREE */
/* global Model */
/* global reactionProperties */

/**
 * Execute some code when the DOM is ready.  If the DOM is already ready
 * before this function is called, execute the code immediately.
 * 
 * Code is by {@link https://gomakethings.com/about/ Chris Ferdinandi}, 
 * copied from {@link https://gomakethings.com/a-native-javascript-equivalent-of-jquerys-ready-method/}.
 * 
 * @param {function} fn - Function to be executed when the DOM is ready.
 */
var ready = function ( fn ) {
    // Sanity check
    if ( typeof fn !== 'function' ) return;

    // If document is already loaded, run method
    if ( document.readyState === 'complete'  ) {
        return fn();
    }
    
    // Otherwise, wait until document is loaded
    document.addEventListener( 'DOMContentLoaded', fn, false );
};

/**
 * Lay out the panels for the 3-D and 2-D displays for the current reaction
 * 
 * @param {Object} props - parameters to be used with the current reaction
 * @param {THREE.WebGLRenderer} renderer 
 */
function setGeometry(props, renderer) {
    const panel = document.getElementById('displays');
    let w = panel.clientWidth;
    let h = panel.clientHeight;
    //console.log('w h:', w, h);
    panel.classList.remove('horizontal', 'vertical');
    panel.classList.add(props.layout);
    if (props.layout === 'vertical') {
        w /= 2;
    }
    else {
        h /= 2;
    }
    renderer.setSize(w, h);
    document.getElementById('svg-elt').setAttribute('viewBox', 
        props['viewBox']);
}

const eyept = new THREE.Vector3();
const yAxis = new THREE.Vector3(0, 1, 0);
/**
 * Set the camera parameters for rendering the current reaction.  Also
 * used for rocking the reaction, by adjusting the eyepoint to effectively
 * rotate the camera about the look-at point.  This allows the scene to be
 * rocked without disturbing the relationship between model space and world
 * space, because the rocking is done by moving the camera instead.
 * 
 * @param {THREE.Camera} camera - camera to be used for rendering
 * @param {*} props - parameters for the current reaction
 * @param {*} angle - angle through which to rotate the camera.  
 *      Used for rocking.
 */
function reshapeCamera(camera, props, angle = 0) {
    camera.fov = props.fov;
    eyept.fromArray(props.eye);
    eyept.applyAxisAngle(yAxis, angle);
    camera.position.set(eyept.x, eyept.y, eyept.z);
    camera.lookAt(0, 0, 0);
    const canvas = document.getElementById('display-3D').firstElementChild;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.near = props.near;
    camera.far = props.far;
    camera.updateProjectionMatrix();
    //console.log(eyept, camera.position);
}

/**
 * Stuff to do only once the DOM is ready.
 */
ready(function() {
    console.log('Doc ready');
    const properties = reactionData();
    console.log('Controller props:', properties.toString());
    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(new THREE.Color( 0.4, 0.4, 0.4 ), 1.0);
    //renderer.sortObjects = false;
    document.getElementById('display-3D').appendChild(renderer.domElement);
    //renderer.domElement.style.setProperty('border', 'thin dashed blue');

    const camera = new THREE.PerspectiveCamera();
    camera.name = 'camera';

    let reaction;
    let rockingAngle;

    const changeReactionFn = function(newReaction) {
        if ((newReaction !== reaction) && (newReaction !== 'none')) {
            reaction = newReaction;
            console.log(reaction);
            //console.log(properties[reaction]);
            setGeometry(properties[reaction], renderer);
            reshapeCamera(camera, properties[reaction]);
            for (let child of scene.children) {
                if (child.name !== 'camera') {
                    scene.remove(child);
                }
            }
            document.getElementById('svg-xfm').innerHTML = '';
            scene.add(new Model(properties[reaction]));
            rockingAngle = properties[reaction].rockingAngle;
            t = 0;
        }
    };
    changeReactionFn('defaults');
    
    document.getElementById('model-select').addEventListener('change', function(evt) {
        changeReactionFn(evt.target.value);
    });

    document.getElementById('slider').addEventListener('input', function(evt) {
        scene.children[0].setT(evt.target.value, scene.quaternion.conjugate())
    });

    let rocking = false;
    document.getElementById('rock-button').addEventListener('click', function(evt) {
        rocking = !rocking;
        if (rocking) {
            evt.target.value = 'Stop rocking';
        }
        else {
            evt.target.value = 'Rock model';
        }
    });
    
    let rt = 0;
    const dt = 0.04;
    function animate() {
        requestAnimationFrame( animate );
        if (rocking === true) {
            rt += dt;
            reshapeCamera(camera, properties[reaction], rockingAngle * Math.sin(rt));
            //camera.rotation.y = rockingAngle * Math.sin(rt);
            //camera.updateProjectionMatrix();
        }
        renderer.render( scene, camera );
    }
    animate();

    console.log('End Doc ready');    
});
