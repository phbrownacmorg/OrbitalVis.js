/* global $ */
/* global THREE */

function reshapeCamera(camera, props) {
    camera.fov = props['fov'];
    var eyept = props['eye'];
    camera.position.set(eyept[0], eyept[1], eyept[2]);
    camera.aspect = $('#display-3D').width() / $('#display-3D').height();
    camera.near = props['near'];
    camera.far = props['far'];
    camera.updateProjectionMatrix();
}

$(document).ready(function() {
    console.log('Doc ready');
    //console.log(JSON.stringify($(document).data('properties')));
    var properties = $(document).data('properties');
    
    var scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xff0000 );
    
    var reaction = '';
    
    var renderer = new THREE.WebGLRenderer();
    $('#display-3D').append(renderer.domElement);
    renderer.domElement.style.setProperty('max-width', '100%');
    renderer.domElement.style.setProperty('height', '100%');
    renderer.domElement.style.setProperty('border', 'thin dashed blue');
    
    var camera = new THREE.PerspectiveCamera(/*properties['default']['fov'],
                                             $('#display-3D').width() / $('#display-3D').height(),
                                             properties['default']['near'],
                                             properties['default']['far']*/);
    camera.name = 'camera';

    var changeReactionFn = function() {
        
        renderer.setSize($('#display-3D').width(), $('#display-3D').height());
        // Set the appropriate geometry on the elements and call renderer.setSize()
        // Clean out the scene's descendants
        // Remake the model
        reshapeCamera(camera, properties[reaction]);
        $(document).data('t', 0);
    };
    
    $('#model-select').change(function(evt) {
        reaction = evt.target.value;
        changeReactionFn();
    });

    function animate() {
        requestAnimationFrame( animate );
        renderer.render( scene, camera );

    }
    animate();

    console.log('End Doc ready');    
});