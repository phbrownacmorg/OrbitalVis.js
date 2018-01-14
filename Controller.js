/* global $ */
/* global THREE */
/* global makeModel */

function setGeometry(props, renderer) {
    let w; 
    let h;
    if (props['layout'] === 'vertical') {
        $('#displays').css('flex-direction', 'row');
        w = $('#displays').width()/2;
        h = $('#displays').height();
    }
    else { // horizontal, which is default
        $('#displays').css('flex-direction', 'column');
        w = $('#displays').width();
        h = $('#displays').height()/2;
    }
    $('#displays').find('*').width(w);
    $('#displays').find('*').height(h);
    $('svg').attr('viewBox', props['viewBox']);

    renderer.setSize($('#display-3D').children().width(), 
                     $('#display-3D').children().height());
}

function reshapeCamera(camera, props) {
    camera.fov = props['fov'];
    let eyept = props['eye'];
    camera.position.set(eyept[0], eyept[1], eyept[2]);
    camera.lookAt(0, 0, 0);
    camera.aspect = $('#display-3D').children().width() / 
                    $('#display-3D').children().height();
    camera.near = props['near'];
    camera.far = props['far'];
    camera.updateProjectionMatrix();
}

$(document).ready(function() {
    console.log('Doc ready');
    let properties = $(document).data('properties');
    console.log(properties);
    let scene = new THREE.Scene();

    let renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(new THREE.Color( 0.4, 0.4, 0.4 ), 1.0);
    renderer.sortObjects = false;
    $('#display-3D').append(renderer.domElement);
    renderer.domElement.style.setProperty('border', 'thin dashed blue');

    let camera = new THREE.PerspectiveCamera();
    camera.name = 'camera';

    let reaction = 'defaults';
    let rockingAngle;
    let t;

    let changeReactionFn = function() {
        setGeometry(properties[reaction], renderer);
        reshapeCamera(camera, properties[reaction]);
        for (let child of scene.children) {
            if (child.name !== 'camera') {
                scene.remove(child);
            }
        }
        scene.add(makeModel(properties[reaction]));
        rockingAngle = properties[reaction]['rockingAngle'];
        t = 0;
    };
    changeReactionFn();
    
    $('#model-select').change(function(evt) {
        if (evt.target.value !== 'none') {
            reaction = evt.target.value;
            changeReactionFn();
        }
    });
    
    $('#slider').on('input', function() {
        //console.log('slider val = ' + $('#slider').val());
        scene.children[0].setT($('#slider').val(), scene.quaternion.conjugate());
    });
    
    let rocking = false;
    $('#rock-button').click(function() {
        rocking = !rocking;
        if (rocking) {
            $('#rock-button').val('Stop rocking');
        }
        else {
            $('#rock-button').val('Rock model');
        }
    });

    let rt = 0;
    let dt = 0.04;
    function animate() {
        requestAnimationFrame( animate );
        if (rocking === true) {
            rt += dt;
            scene.rotation.y = rockingAngle * Math.sin(rt);
        }
        renderer.render( scene, camera );
    }
    animate();

    console.log('End Doc ready');    
});