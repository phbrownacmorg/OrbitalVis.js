/* global $ */

$(document).ready(function() {
    let props = {   
      defaults: { reaction: 'defaults',
                  fov: 16, near: 500, far: 1500,
                  eye: [250, 250, 1000], 
                  rockingAngle: Math.PI / 12,
                  layout: "horizontal",
                  viewBox: "-500 -100 1000 200",
                  Scale2D: [100, 100, 40] },
      Acyl:     { layout: "vertical",
		          viewBox: "-100 -300 200 600",
		          Scale2D: [100, 200, 40],
                  fov: 40 },
	  "Acyl-L": { reaction: "Acyl-L" },
	  "Acyl-R": { reaction: "Acyl-R" },
	  E1:       { reaction: "E1",
	              fov: 25, eye: [250, 50, 1000],
				  viewBox: "-800 -160 1600 320" },
	  E2:       { reaction: "E2",
	           	  fov: 25, eye: [250, 50, 1000],
				  viewBox: "-800 -160 1600 320" },
	  EA2A:     { layout: "vertical",
				  viewBox: "-100 -300 200 600",
				  fov: 50 },
	  "EA2A-L": { reaction: "EA2A-L" },
	  "EA2A-R": { reaction: "EA2A-R" },
	  SAPA:     { fov: 30,
	              viewBox: "-1000 -200 2000 400" },
      "SAPA-L": { reaction: "SAPA-L" },
	  "SAPA-R": { reaction: "SAPA-R" },
	  SN1:      { layout: "vertical",
	          	  viewBox: "-100 -300 200 600",
			      fov: 45 },
	  "SN1-L":  { reaction: "SN1-L" },
	  "SN1-R":  { reaction: "SN1-R" },
      SN2:      { reaction: 'SN2' }
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
                
