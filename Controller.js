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

function setGeometry(props, renderer) {
    const panel = document.getElementById('displays');
    let w = panel.clientWidth;
    let h = panel.clientHeight;
    console.log('w h:', w, h);
    panel.classList.remove('horizontal', 'vertical');
    panel.classList.add(props.layout);
    if (props.layout === 'vertical') {
        w /= 2;
    }
    else {
        h /= 2;
    }
    renderer.setSize(w, h);
    document.getElementById('svg-elt').setAttribute('viewBox', props['viewBox']);
}

function reshapeCamera(camera, props) {
    camera.fov = props.fov;
    let eyept = props.eye;
    camera.position.set(eyept[0], eyept[1], eyept[2]);
    camera.lookAt(0, 0, 0);
    const canvas = document.getElementById('display-3D').firstElementChild;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.near = props.near;
    camera.far = props.far;
    camera.updateProjectionMatrix();
    //console.log(eyept, camera.position);
}

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
        }
        scene.rotation.y = rockingAngle * Math.sin(rt);
        renderer.render( scene, camera );
    }
    animate();

    console.log('End Doc ready');    
});
