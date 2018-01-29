/* global $ */

$(document).ready(function() {
    let props = {   defaults: { reaction: 'defaults',
                                fov: 16, near: 500, far: 1500,
                                eye: [250, 250, 1000], 
                                rockingAngle: Math.PI / 12,
                                layout: "horizontal",
                                viewBox: "-500 -100 1000 200",
                                Scale2D: [100, 100, 40] },
                    Acyl:     { layout: "vertical",
                                fov: 40 },
                    "Acyl-L": { reaction: "Acyl-L" },
                    "Acyl-R": { reaction: "Acyl-R" },
                    SN2:      { reaction: 'SN2'}
                };

    function provideDefaults(baseKey, reaction) {
        for (const key in props[baseKey]) {
            if (!(key in props[reaction])) {
                props[reaction][key] = props[baseKey][key];
            }
        }
    }
    
    // Copy default properties to every other mechanism, except where overridden
    for (const reaction in props) {
        if (reaction.endsWith('-L') || reaction.endsWith('-R')) {
            let base = reaction.substring(0, reaction.length - 2);
            provideDefaults(base, reaction);
        }
        provideDefaults('defaults', reaction);
    }
    //console.log(props);
    
    $(document).data('properties', props);
});                    
                