/* global $ */
/* global THREE */

/* global makeAcyl */
/* global makeEA2A */
/* global makeSN1 */
/* global makeSN2 */

// Bond states
const BROKEN = 0;
const PARTIAL = 0.5;
const FULL = 1;
const FULL_PARTIAL = 1.5;
const DOUBLE = 2;
const BACK_SLANT = -2;
const FRONT_SLANT = -1;
const BOND_LENGTH_FACTOR = 0.3; // Open space at the beginning of the bond
const WEDGE_LENGTH_FACTOR = 0.3; // Open space at the beginning of the bond
const WEDGE_WIDTH = 4;
const DOUBLE_OFFSET = 3; // Half the distance between the lines of a double bond
class Bond extends THREE.Group {
    constructor(end1, end2, bond_state) {
        super();
        this.start = end1;
        this.end = end2;
        this.g = document.createElementNS("http://www.w3.org/2000/svg", 'g');
        this.path1 = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        this.g.appendChild(this.path1);
        this.path2 = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        this.g.appendChild(this.path2);
        this.setState(bond_state);
    }
    
    getState() { return this.bond_state; }
    setState(newState) { 
        this.bond_state = newState;
        switch (this.bond_state) {
            case BROKEN:
                this.path1.setAttribute('class', 'broken');
                this.path2.setAttribute('class', 'broken');
                break;
            case PARTIAL:
                this.path1.setAttribute('class', 'partial');
                this.path2.setAttribute('class', 'broken');
                break;
            case FULL:
                this.path1.setAttribute('class', 'full');
                this.path2.setAttribute('class', 'broken');
                break;
            case FULL_PARTIAL:
                this.path1.setAttribute('class', 'partial');
                this.path2.setAttribute('class', 'full');
                break;
            case DOUBLE:
                this.path1.setAttribute('class', 'full');
                this.path2.setAttribute('class', 'full');
                break;
            case BACK_SLANT: // Full bond slanted away from the viewer
                this.path1.setAttribute('class', 'backslant');
                this.path2.setAttribute('class', 'broken');
                break;
            case FRONT_SLANT: // Full bond slanted towards the viewer
                this.path1.setAttribute('class', 'frontslant');
                this.path2.setAttribute('class', 'broken');
                break;
        }
    }
    
    get2DElt() { return this.g; }
    
    update2D(revQuat) {
        if (this.bond_state !== BROKEN) {
            let pt1 = this.start.get2DPos(revQuat);
            let pt2 = this.end.get2DPos(revQuat);
            let start = pt1.clone().lerp(pt2, BOND_LENGTH_FACTOR);
            let end = pt2.clone().lerp(pt1, BOND_LENGTH_FACTOR);
            let diff = end.clone().sub(start);
            //console.log("Z's: " + pt1.z + ' ' + pt2.z);
            this.g.setAttribute('transform', 'rotate(' + 
                                THREE.Math.radToDeg(diff.angle()) +
                                ' ' + start.x + ' ' + start.y + ')');
	    
	    switch (this.bond_state) {
	    case PARTIAL:
	    case FULL:
		this.path1.setAttribute('d', 
                                        'M' + start.x + ',' + start.y +
                                        ' h' + diff.length());
		break;
	    case FULL_PARTIAL:
	    case DOUBLE:
		this.path1.setAttribute('d',
					'M' + (start.x) + ','
					    + (start.y + DOUBLE_OFFSET) +
					' h' + diff.length());
		this.path2.setAttribute('d',
					'M' + (start.x) + ','
					    + (start.y - DOUBLE_OFFSET) +
					' h' + diff.length());
		break;
	    case BACK_SLANT:
	    case FRONT_SLANT:
		this.path1.setAttribute('d',
                                        'M' + start.x +',' + start.y +
                                        ' l' + diff.length() + ','
					     + WEDGE_WIDTH +
                                        ' v' + (-2 * WEDGE_WIDTH) + ' Z');
		break;
	    default: // Shouldn't happen
		break;
	    }
        }
    }
}

// setRenderOrder isn't a method of the Model class because it's recursive.
//     Most of the things it's called on are not actually Models, but sub-objects.
const Z_RENDER_ORDER_SCALE = 0.002;
function setRenderOrder(obj) {
    // Precondition: obj is a THREE.Object3D
    let worldPos = new THREE.Vector3();
    obj.getWorldPosition(worldPos);
    obj.renderOrder = worldPos.z * Z_RENDER_ORDER_SCALE + 0.5;
    // assert obj.renderOrder is in [0, 1]
    if ((obj.renderOrder < 0) || (obj.renderOrder > 1)) {
		console.log("ERROR: ", obj.id, obj.renderOrder, worldPos);
    }
    // else {
    // 	console.log(obj.id, obj.renderOrder, worldPos);
    // }
    obj.children.forEach( setRenderOrder );
}

class Model extends THREE.Group {
	constructor(props) {
		super();
		this.needsUpdates = [];
		this.setSide(props.reaction);
		
		switch(props.reaction) {
			case 'Acyl-L':
			case 'Acyl-R':
				makeAcyl(this, props);
				break;
			case 'E1':
				makeE1(this, props);
				break;
			case 'EA2A-L':
			case 'EA2A-R':
				makeEA2A(this, props);
				break;
			case 'SN1-L':
			case 'SN1-R':
				makeSN1(this, props);
				break;
			case 'SN2':
				makeSN2(this, props);
				break;
			default:
				this.add(new THREE.AxesHelper(100));
				this.setT = function(newT, revQuat) {};
				break;
		}
		
		setRenderOrder(this);
        this.updateDOM();
	}

    // Set this.xSign
    setSide(reaction) {
        this.xSign = 0; // Ignored for reaction mechanisms that don't care about the side
		if (reaction.endsWith('-L')) {
		    this.xSign = -1;
		}
		else if (reaction.endsWith('-R')) {
		    this.xSign = 1;
		}
    }

    // Add the 2D elements to the DOM.  Clear out any cruft in the place where they go first.
    updateDOM() {
        $('#svg-xfm').empty();
        for (let item of this.needsUpdates) {
    	    // Bonds should really be added to the DOM first, 
			//     so they lie behind the atoms/groups
        	const elt = item.get2DElt();
        	if (elt.tagName == 'text') {
            	$('#svg-xfm').append(elt);
        	}
        	else {
            	$('#svg-xfm').prepend(elt);
        	}
        	item.update2D(new THREE.Quaternion());
    	}
    }
}
