/* global $ */

$(document).ready(function() {
    console.log('Doc ready');
    //console.log(JSON.stringify($(document).data('properties')));
    var properties = $(document).data('properties');

    $('#model-select').change(function(evt) {
        switch (evt.target.value) {
            case 'SN2':
                break;
        }
    });

    console.log('End Doc ready');    
});