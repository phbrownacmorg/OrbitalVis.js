/* global THREE */

/**
 * Colors of the different elements.
 * 
 * When extending this, beware: THREE.js uses X11 color names, which are
 * only *mostly* the same as the W3C color names.
 */
const COLORS = {
    C: 'black', Cl: 'rgb(0, 221, 0)', H: 'white',
    O: 'rgb(221, 0, 0)'
};

/**
 * Make and return the material for an atom of a given element.
 * 
 * @param {string} name - Name of the element
 * @return {THREE.Material} - Material to be used in rendering the atom
 */
function makeAtomMaterial(name) {
    return new THREE.MeshBasicMaterial({
        color: COLORS[name],
        depthTest: false,
        opacity: 0.3,
        transparent: true,
        side: THREE.DoubleSide
    });
}

// 2D calculation needs to be here because AtomGroup uses it
const Z_2D_SCALE = -0.5;  // Probably only works for eye.x > 0
/**
 * @param {THREE.Vector3} v - 3-space position to convert to 2-D
 * @return {THREE.Vector2} - 2-D position corresponding to v
 */
function vec3To2D(v) {
    // Warped sort-of-parallel projection
    let result = new THREE.Vector2(v.x + Z_2D_SCALE * v.z,
        -v.y - (Z_2D_SCALE / 4) * v.z);
    result.z = v.z;
    return result;
}

// Unit vectors
const unitX = new THREE.Vector3(1, 0, 0);
const unitY = new THREE.Vector3(0, 1, 0);
const unitZ = new THREE.Vector3(0, 0, 1);

/**
 * Class to represent an atom or a group (something that can be represented
 * in 2-D as a single text string).  This class basically adds the 2-D
 * string to the THREE.Group holding the 3-D representation of the atom or
 * group.
 * 
 * Additionally, the class allows X and Y offsets to be specified.  These
 * apply a constant translation to the atom or group's 2-D location, so
 * that the 2-D representations don't get too tangled with each other.
 */
class AtomGroup extends THREE.Group {
    constructor(name, tx = 0, ty = 0) {
        super();
        this.name = name;
        this.offsets = new THREE.Vector2(tx, ty);
        if (name && name !== '') {
            this.textElt = document.createElementNS(
                "http://www.w3.org/2000/svg", 'text');
            this.textElt.innerHTML = name;
            this.textElt.setAttribute('class', name);
            this.textElt.setAttribute('x', '0');
            this.textElt.setAttribute('y', '0');
            //console.log('Creating 2D for ' + name + ": "
            //            + this.textElt.toString());
        }
    }

    get2DElt() {
        return this.textElt;
    }

    get2DPos(revQuat) {
        return vec3To2D(this.getWorldPosition().applyQuaternion(revQuat))
            .add(this.offsets);
    }

    update2D(revQuat) {
        const textPos = this.get2DPos(revQuat);
        this.textElt.setAttribute('x', textPos.x);
        this.textElt.setAttribute('y', textPos.y);
    }

}

const S_RADIUS = 25;
/**
 * An atom containing only an s-orbital.
 */
class SAtom extends AtomGroup {
    constructor(name, text = name, tx = 0, ty = 0) {
        super(text, tx, ty);
        let geom = new THREE.SphereGeometry(S_RADIUS, 64, 64);
        this.add(new THREE.Mesh(geom, makeAtomMaterial(name)));
    }
}

// Half the minimum central angle of a POrbital's cone
const MIN_CENTRAL_ANGLE = THREE.Math.degToRad(15);
// Half the maximum central angle of a POrbital's cone
const MAX_CENTRAL_ANGLE = THREE.Math.degToRad(60);
// length of a lobe if proportion = 1
const LOBE_LENGTH = 4 * S_RADIUS;
const HALF_LOBE = LOBE_LENGTH / 2;

/**
 * A p-orbital.
 */
class POrbital extends THREE.Group {
    constructor(lobeProportion, divergence, material) {
        super();
        this.name = 'orbital';
        this.proportion = lobeProportion;

        this.lobe0 = POrbital.makeHalfPOrbital(1.0 - lobeProportion, material);
        this.add(this.lobe0);

        this.lobe1 = POrbital.makeHalfPOrbital(lobeProportion, material);
        this.lobe1.position.set(-HALF_LOBE * lobeProportion, 0, 0);
        this.lobe1.rotateZ(Math.PI);
        this.add(this.lobe1);

        this.setDivergence(divergence);
    }

    /**
     * Set the divergence factor to newD, where 0 <= newD <= 1.  This causes
     * the orbital's central angle to take on a value linearly interpolated 
     * (using newD) between MIN_CENTRAL_ANGLE (when newD == 0) and 
     * MAX_CENTRAL_ANGLE (when newD == 1).
     * 
     * @param {*} newD 
     */
    setDivergence(newD) {
        this.centralAngle = THREE.Math.lerp(MIN_CENTRAL_ANGLE,
            MAX_CENTRAL_ANGLE, newD);
        //console.log(THREE.Math.radToDeg(this.centralAngle));
        this.updatePositionsScales();
    }

    /**
     * Nest a given object within the frame of reference of this orbital.
     * The location of the object is a given distance beyond the end of the
     * orbital.
     * 
     * @param {THREE.Object} obj - Graphics object to be set
     * @param {float} extraDist - extra distance between the end of the
     *      orbital and the location of obj
     */
    addOnEnd(obj, extraDist) {
        obj.position.set(extraDist + LOBE_LENGTH * (1.0 - this.proportion),
            0, 0);
        this.add(obj);
    }

    setLobeProportion(newProp) {
        this.proportion = newProp;
        this.updatePositionsScales();
    }

    updatePositionsScales() {
        let divergenceFactor = Math.tan(this.centralAngle)
            / Math.tan(MIN_CENTRAL_ANGLE);
        let prop = this.proportion;
        //if (this.centralAngle !== MIN_CENTRAL_ANGLE) {
        //console.log(divergenceFactor, prop);
        //}
        this.lobe1.position.set(-HALF_LOBE * prop, 0, 0);
        this.lobe1.scale.set(prop * divergenceFactor, prop, prop);
        this.lobe0.position.set(HALF_LOBE * (1 - prop), 0, 0);
        this.lobe0.scale.set((1 - prop) * divergenceFactor, 1 - prop, 1 - prop);
    }

    /**
     * @return {THREE.Vector3} - a unit vector in the direction of this orbital.
     */
    unitVec() {
        return unitX.clone()
            .applyQuaternion(this.quaternion).normalize()
    }

    // Takes a THREE.Vector3 VEC in orbital space, and returns the
    // same vector in the space of the model.
    orbitalToModel(vec = unitX.clone()) {
        //console.log(vec);
        let obj = this;
        while (obj.name !== 'model') {
            // Transform vec into the parent's frame of reference
            vec.applyQuaternion(obj.quaternion);
            vec.multiply(obj.scale);
            vec.add(obj.position);
            // Not obvious to me why applying obj.matrix won't do, but
            // it doesn't

            //console.log(obj.name, vec);  
            obj = obj.parent;
        }
        return vec;
    }

    static makeHalfPOrbital(scalingFactor, material) {
        const R = 100 * Math.tan(MIN_CENTRAL_ANGLE);
        const SEGS = 64;
        let geom = new THREE.ConeGeometry(R, 100, SEGS, 1, false);
        let cone = new THREE.Mesh(geom, material);
        geom = new THREE.SphereGeometry(R, SEGS, 8, 0, Math.PI * 2,
            Math.PI / 2, Math.PI);
        let cap = new THREE.Mesh(geom, material);
        cap.translateY(-50);
        cone.add(cap);
        cone.rotateZ(Math.PI / 2);
        return cone;
    }
}

// Proportion of the volume of orbital 0 in the (initially) small lobe
const DEFAULT_LOBE_PROP = 1 / 3;
const MIN_DIVERGENCE = 0;
const MAX_DIVERGENCE = 1;
const RELAXED_ANGLE = Math.acos(-1 / 3.0);
const S_SP3_BOND_LENGTH = LOBE_LENGTH * (1 - DEFAULT_LOBE_PROP) + S_RADIUS;
const SP3_SP3_BOND_LENGTH = 2 * LOBE_LENGTH * (1 - DEFAULT_LOBE_PROP);

const S_SP3_VEC = new THREE.Vector3(S_SP3_BOND_LENGTH, 0, 0);
const SP3_SP3_VEC = new THREE.Vector3(SP3_SP3_BOND_LENGTH, 0, 0);

class SP3Atom extends AtomGroup {
    constructor(name, text = name, tx = 0, ty = 0) {
        super(text, tx, ty);

        const material = makeAtomMaterial(name);
        this.insideOutness = 0;  // in [0, 1]

        this.orbitals = [];
        for (let i = 0; i < 4; i++) {
            this.orbitals.push(new POrbital(DEFAULT_LOBE_PROP, MIN_DIVERGENCE,
                material));
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
        this.orbitals[0].setLobeProportion(
            THREE.Math.lerp(DEFAULT_LOBE_PROP, 1 - DEFAULT_LOBE_PROP, newProp));
        // (1 - newProp) * DEFAULT_LOBE_PROP
        //              + newProp * (1 - DEFAULT_LOBE_PROP));
        this.setZeroOneAngle(THREE.Math.lerp(RELAXED_ANGLE,
            Math.PI - RELAXED_ANGLE, newProp));
        //+ newProp * (Math.PI - RELAXED_ANGLE));
    }

    setZeroOneAngle(angle, lastOrbital = 3) {
        this.zeroOneAngle = angle;
        for (let i = 1; i < 4; i++) {
            if (i <= lastOrbital) {
                let axis = new THREE.Vector3(0, 0, -1);
                axis.applyAxisAngle(unitX,
                    (i - 1) * 2 * Math.PI / 3);
                this.orbitals[i].setRotationFromAxisAngle(axis.normalize(),
                    this.zeroOneAngle);
            }
            else { // i > lastOrbital
                // This is wrong.  The 2 and 3 orbitals, in this case, should
                // be in the plane containing the nucleus and the midpoint of
                // the 0 and 1 orbitals, perpendicular to the plane defined by
                // the 0 and 1 orbitals.  But my geometry is apparently not good
                // enough to calculate that plane and then rotate in it.
                let axis = new THREE.Vector3(0, 0, -1);
                axis.applyAxisAngle(unitX,
                    (i - 1) * 2 * Math.PI / 3);
                this.orbitals[i].setRotationFromAxisAngle(
                    axis.normalize(),
                    THREE.Math.lerp(RELAXED_ANGLE, Math.PI - RELAXED_ANGLE,
                        this.insideOutness));
            }
        }
    }
}

class Hydroxide extends SP3Atom {
    constructor(text = 'OH', tx = 0, ty = 0) {
        super('O', text, tx, ty);
        this.addToOrbital(1, new SAtom('H', ''), S_RADIUS);
    }
}

class Methyl extends SP3Atom {
    constructor(text = 'CH3', tx = 0, ty = 0) {
        super('C', text, tx, ty);
        for (let i = 1; i < 4; i++) {
            this.addToOrbital(i, new SAtom('H', ''), S_RADIUS);
        }
    }
}

class Ethyl extends SP3Atom {
    constructor(text = 'CH2CH3', tx = 0, ty = 0) {
        super('C', text, tx, ty);
        const methyl = new Methyl('');
        methyl.setInsideOutness(1.0);
        methyl.rotateX(Math.PI);
        this.addToOrbital(1, methyl, SP3_SP3_BOND_LENGTH / 2);
        for (let i = 2; i < 4; i++) {
            this.addToOrbital(i, new SAtom('H', ''), S_RADIUS);
        }
    }
}

class Water extends SP3Atom {
    constructor(text = 'H2O', tx = 0, ty = 0) {
        super('O', text, tx, ty);
        for (let i = 2; i < 4; i++) {
            this.addToOrbital(i, new SAtom('H', ''), S_RADIUS);
        }
    }
}
