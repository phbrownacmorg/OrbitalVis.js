/* global THREE */

// Beware: COLORS (for THREE.js) uses X11 color names, which are only
//     *mostly* the same as the W3C color names.
const COLORS = { C: 'black', Cl: 'rgb(0, 221, 0)', H: 'white', O: 'rgb(221, 0, 0)' };

function makeAtomMaterial(name) {
    return new THREE.MeshBasicMaterial( {
            color: COLORS[name],
            depthTest: false,
            opacity: 0.3,
            transparent: true,
            side: THREE.DoubleSide
    } );
}

// 2D calculation needs to be here because AtomGroup uses it
const Z_2D_SCALE = -0.5;  // Probably only works for eye.x > 0
function vec3To2D(v) {
    // Warped sort-of-parallel projection
    let result = new THREE.Vector2(v.x + Z_2D_SCALE * v.z,
				   -v.y - (Z_2D_SCALE/4) * v.z);
    result.z = v.z;
    return result;
}

class AtomGroup extends THREE.Group {
    constructor(name) {
        super();
        this.name = name;
        if (name && name !== '') {
            this.textElt = document.createElementNS("http://www.w3.org/2000/svg", 'text');
            this.textElt.innerHTML = name;
            this.textElt.setAttribute('class', name);
            this.textElt.setAttribute('x', '0');
            this.textElt.setAttribute('y', '0');
            //console.log('Creating 2D for ' + name + ": " + this.textElt.toString());
        }
    }
    
    get2DElt() {
        return this.textElt;
    }
    
    get2DPos(revQuat) {
        return vec3To2D(this.getWorldPosition().applyQuaternion(revQuat));
    }
    
    update2D(revQuat) {
        const textPos = this.get2DPos(revQuat);
        this.textElt.setAttribute('x', textPos.x);
        this.textElt.setAttribute('y', textPos.y);
    }

}

const S_RADIUS = 25;
class SAtom extends AtomGroup {
	constructor(name, text=name) {
		super(text);
		let geom = new THREE.SphereGeometry(S_RADIUS, 64, 64);
		this.add(new THREE.Mesh(geom, makeAtomMaterial(name)));
	}
}

// Half the minimum central angle of a POrbital's cone
const MIN_CENTRAL_ANGLE = THREE.Math.degToRad(15); 
// Half the maximum central angle of a POrbital's cone
const MAX_CENTRAL_ANGLE = THREE.Math.degToRad(60);

class POrbital extends THREE.Group {
    constructor(lobeProportion, divergence, material) {
        super();
        this.proportion = lobeProportion;
        
        this.lobe0 = POrbital.makeHalfPOrbital(1.0 - lobeProportion, material);
        this.add(this.lobe0);
        
        this.lobe1 = POrbital.makeHalfPOrbital(lobeProportion, material);
        this.lobe1.position.set(-50 * lobeProportion, 0, 0);
        this.lobe1.rotateZ(Math.PI);
        this.add(this.lobe1);
        
        this.setDivergence(divergence);
    }
    
    setDivergence(newD) {
        this.centralAngle = THREE.Math.lerp(MIN_CENTRAL_ANGLE, MAX_CENTRAL_ANGLE, newD);
        //console.log(THREE.Math.radToDeg(this.centralAngle));
        this.updatePositionsScales();
    }
    
    addOnEnd(obj, extraDist) {
        obj.position.set(extraDist + 100 * (1.0 - this.proportion), 0, 0);
        this.add(obj);
    }
    
    setLobeProportion(newProp) {
        this.proportion = newProp;
        this.updatePositionsScales();
    }
    
    updatePositionsScales() {
        let divergenceFactor = Math.tan(this.centralAngle) / Math.tan(MIN_CENTRAL_ANGLE);
        let prop = this.proportion;
        //if (this.centralAngle !== MIN_CENTRAL_ANGLE) {
            //console.log(divergenceFactor, prop);
        //}
        this.lobe1.position.set(-50 * prop, 0, 0);
        this.lobe1.scale.set(prop * divergenceFactor, prop, prop);
        this.lobe0.position.set(50 * (1 - prop), 0, 0);
        this.lobe0.scale.set((1 - prop) * divergenceFactor, (1 - prop), 1 - prop);        
    }

    static makeHalfPOrbital(scalingFactor, material) {
        const R = 100 * Math.tan(MIN_CENTRAL_ANGLE);
        const SEGS = 64;
        let geom = new THREE.ConeGeometry(R, 100, SEGS, 1, false);
        let cone = new THREE.Mesh(geom, material);
        geom = new THREE.SphereGeometry(R, SEGS, 8, 0, Math.PI*2, 
                                        Math.PI/2, Math.PI);
        let cap = new THREE.Mesh(geom, material);
        cap.translateY(-50);
        cone.add(cap);
        cone.rotateZ(Math.PI/2);
        return cone;
    }   
}

// Proportion of the volume of orbital 0 in the (initially) small lobe
const DEFAULT_LOBE_PROP = 1/3;
const MIN_DIVERGENCE = 0;
const MAX_DIVERGENCE = 1;
const RELAXED_ANGLE = Math.acos(-1/3.0);
const S_SP3_BOND_LENGTH = 100 * (1 - DEFAULT_LOBE_PROP) + S_RADIUS;
const SP3_SP3_BOND_LENGTH = 100 * (1 - DEFAULT_LOBE_PROP);  // Why only 100?

class SP3Atom extends AtomGroup {
    constructor(name, text=name) {
        super(text);
        
        const material = makeAtomMaterial(name);
        this.insideOutness = 0;  // in [0, 1]
        
        this.orbitals = [];
        for (let i = 0; i < 4; i++) {
            this.orbitals.push(new POrbital(DEFAULT_LOBE_PROP, MIN_DIVERGENCE, material));
        }

        this.setZeroOneAngle(RELAXED_ANGLE);

        for (let orb of this.orbitals) {
            this.add(orb);
        }
    }
    
    addToOrbital(i, obj, extraDistance) {
        this.orbitals[i].addOnEnd(obj, extraDistance);
    }
    
    setP0Divergence(newD) {
        this.orbitals[0].setDivergence(newD);
    }
    
    setInsideOutness(newProp) {
        this.insideOutness = newProp;
        this.orbitals[0].setLobeProportion((1 - newProp) * DEFAULT_LOBE_PROP
                                            + newProp * (1 - DEFAULT_LOBE_PROP));
        this.setZeroOneAngle((1 - newProp) * RELAXED_ANGLE
                             + newProp * (Math.PI - RELAXED_ANGLE));
    }

    setZeroOneAngle(angle) {
        this.zeroOneAngle = angle;
        for (let i = 1; i < 4; i++) {
            let axis = new THREE.Vector3(0, 0, -1);
            axis.applyAxisAngle(new THREE.Vector3(1, 0, 0), 
                                (i-1) * 2 * Math.PI/3);
            this.orbitals[i].setRotationFromAxisAngle(axis.normalize(), 
                                                        this.zeroOneAngle);
        }
    }
}

class Hydroxide extends SP3Atom {
	constructor(text = 'OH') {
		super('O', text);
		this.addToOrbital(1, new SAtom('H', ''), S_RADIUS);
	}
}

class Methyl extends SP3Atom {
	constructor(text='CH3') {
		super('C', text);
		for (let i = 1; i < 4; i++) {
     	   this.addToOrbital(i, new SAtom('H', ''), S_RADIUS);
    	}
	}
}

class Ethyl extends SP3Atom {
	constructor(text = 'CH2CH3') {
		super('C', text);
		const methyl = new Methyl('');
		methyl.setInsideOutness(1.0);
		methyl.rotateX(Math.PI);
		this.addToOrbital(1, methyl, SP3_SP3_BOND_LENGTH);
    	for (let i = 2; i < 4; i++) {
        	this.addToOrbital(i, new SAtom('H', ''), S_RADIUS);	   	 		 }
	}
}

class Water extends SP3Atom {
	constructor(text = 'H2O') {
    	super('O', text);
    	for (let i = 2; i < 4; i++) {
			this.addToOrbital(i, new SAtom('H', ''), S_RADIUS);
    	}
	}
}


