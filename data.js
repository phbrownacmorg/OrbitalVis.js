/* global $ */

$(document).ready(function() {
    let props = {   defaults: { reaction: 'defaults',
                                fov: 16, near: 500, far: 1500,
                                eye: [250, 250, 1000], 
                                rockingAngle: Math.PI / 12,
                                layout: "horizontal",
                                viewBox: "-500 -100 1000 200",
                                Scale2D: [100, 100, 40] },
                    SN2:      { reaction: 'SN2'}
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
                