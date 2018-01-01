/* global $ */

$(document).ready(function() {
    let props = {   defaults: { fov: 16, near: 5, far: 15,
                                eye: [2.5, 2.5, 10], 
                                rockingAngle: Math.PI / 12,
                                layout: "horizontal" },
                    SN2:      { }
                };

    // Copy default properties to every other mechanism, except where overridden
    for (const reaction in props) {
        for (const key in props['defaults']) {
            if (!(key in props[reaction])) {
                props[reaction][key] = props['defaults'][key];
            }
        }
    }
    
    $(document).data('properties', props);
});                    
                