/* global $ */
/* global THREE */

// Beware: COLORS (for THREE.js) uses X11 color names, which are only *mostly*
//     the same as the W3C color names.
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

const Z_2D_SCALE = 0.4;
function vec3To2D(v) {
    return new THREE.Vector2(v.x + Math.sign(v.x) * Z_2D_SCALE * v.z, v.y);
}

// Bond states
const BROKEN = 0;
const PARTIAL = 0.5;
const FULL = 1;
const FULL_PARTIAL = 1.5;
const DOUBLE = 2;
const BOND_LENGTH_FACTOR = 0.8;
const WEDGE_LENGTH_FACTOR = 0.7;
class Bond extends THREE.Group {
    constructor(end1, end2, bond_state) {
        super();
        this.start = end1;
        this.end = end2;
        this.g = document.createElementNS("http://www.w3.org/2000/svg", 'g');
        this.line1 = document.createElementNS("http://www.w3.org/2000/svg", 'line');
        this.g.appendChild(this.line1);
        this.line2 = document.createElementNS("http://www.w3.org/2000/svg", 'line');
        this.g.appendChild(this.line2);
        this.setState(bond_state);
    }
    
    getState() { return this.bond_state; }
    setState(newState) { 
        this.bond_state = newState;
        switch (this.bond_state) {
            case BROKEN:
                this.line1.setAttribute('class', 'broken');
                this.line2.setAttribute('class', 'broken');
                break;
            case PARTIAL:
                this.line1.setAttribute('class', 'partial');
                this.line2.setAttribute('class', 'broken');
                break;
            case FULL:
                this.line1.setAttribute('class', 'full');
                this.line2.setAttribute('class', 'broken');
                break;
            case FULL_PARTIAL:
                this.line1.setAttribute('class', 'partial');
                this.line2.setAttribute('class', 'full');
                break;
            case DOUBLE:
                this.line1.setAttribute('class', 'full');
                this.line2.setAttribute('class', 'full');
                break;
        }
    }
    
    get2DElt() { return this.g; }
    
    update2D(revQuat) {
        if (this.bond_state !== BROKEN) {
            let pt1 = this.start.get2DPos(revQuat);
            let pt2 = this.end.get2DPos(revQuat);

            // Calculation in the plane
            let start = new THREE.Vector2(pt2.x, pt2.y);
            start.lerp(pt1, BOND_LENGTH_FACTOR);
            let end = new THREE.Vector2(pt1.x, pt1.y);
            end.lerp(pt2, BOND_LENGTH_FACTOR);
            if (this.bond_state === PARTIAL || this.bond_state === FULL) {
                this.line1.setAttribute('x1', start.x);
                this.line1.setAttribute('y1', -start.y);
                this.line1.setAttribute('x2', end.x);
                this.line1.setAttribute('y2', -end.y);
            }
            // Fill in the double-bond calcs later
        }
    }
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
        this.textElt.setAttribute('y', -(textPos.y));
    }
}

const S_RADIUS = 25;
function makeSAtom(name) {
    let atom = new AtomGroup(name);
    let geom = new THREE.SphereGeometry(S_RADIUS, 64, 64);
    atom.add(new THREE.Mesh(geom, makeAtomMaterial(name)));
    return atom;
}

class POrbital extends THREE.Group {
    constructor(lobeProportion, material) {
        super();
        this.proportion = lobeProportion;

        this.lobe0 = POrbital.makeHalfPOrbital(1.0 - lobeProportion, material);
        this.add(this.lobe0);
        
        this.lobe1 = POrbital.makeHalfPOrbital(lobeProportion, material);
        this.lobe1.position.set(-50 * lobeProportion, 0, 0);
        this.lobe1.rotateZ(Math.PI);
        this.add(this.lobe1);
    }
    
    addOnEnd(obj, extraDist) {
        obj.position.set(extraDist + 100 * (1.0 - this.proportion), 0, 0);
        this.add(obj);
    }
    
    setLobeProportion(newProp) {
        this.lobe1.position.set(-50 * newProp, 0, 0);
        this.lobe1.scale.set(newProp, newProp, newProp);
        this.lobe0.position.set(50 * (1 - newProp), 0, 0);
        this.lobe0.scale.set(1 - newProp, 1 - newProp, 1 - newProp);
    }
    
    static makeHalfPOrbital(scalingFactor, material) {
        const R = 100 * Math.asin(Math.PI / 12);
        const SEGS = 64;
        let geom = new THREE.ConeGeometry(R, 100, SEGS, 1, false);
        let cone = new THREE.Mesh(geom, material);
        geom = new THREE.SphereGeometry(R, SEGS, 8, 0, Math.PI*2, 
                                        Math.PI/2, Math.PI);
        let cap = new THREE.Mesh(geom, material);
        cap.translateY(-50);
        cone.add(cap);
        cone.position.set(50 * scalingFactor, 0, 0);
        cone.rotateZ(Math.PI/2);
        cone.scale.set(scalingFactor, scalingFactor, scalingFactor);
        return cone;
    }
    
}

// Proportion of the volume of orbital 0 in the (initially) small lobe
const DEFAULT_LOBE_PROP = 1/3; 
const RELAXED_ANGLE = Math.acos(-1/3.0);

class SP3Atom extends AtomGroup {
    constructor(name) {
        super(name);
        
        const material = makeAtomMaterial(name);
        this.insideOutness = 0;  // in [0, 1]
        
        this.orbitals = new Array();
        for (let i = 0; i < 4; i++) {
            this.orbitals.push(new POrbital(DEFAULT_LOBE_PROP, material));
        }

        this.setZeroOneAngle(RELAXED_ANGLE);

        for (let orb of this.orbitals) {
            this.add(orb);
        }
    }
    
    addToOrbital(i, obj, extraDistance) {
        this.orbitals[i].addOnEnd(obj, extraDistance);
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

function makeHydroxide() {
    let oxy = new SP3Atom('O');
    let hydro = makeSAtom('H');
    oxy.addToOrbital(1, hydro, S_RADIUS);
    hydro.get2DElt().innerHTML = '';
    oxy.get2DElt().innerHTML = 'HO';
    return oxy;
}

function makeSN2() {
    let model = new THREE.Group();
    model.needsUpdates = new Array();
    
    let oh = makeHydroxide();
    oh.start = new THREE.Vector3(-200 * (1 - DEFAULT_LOBE_PROP) - 100, 0, 0);
    oh.end = new THREE.Vector3(-200 * (1 - DEFAULT_LOBE_PROP), 0, 0);
    oh.position.copy(oh.start);
    model.add(oh);
    model.needsUpdates.push(oh);
    
    let carb = new SP3Atom('C');
    //carb.rotateY(Math.PI);
    model.add(carb);
    model.needsUpdates.push(carb);
    
    let carb_oh = new Bond(carb, oh, BROKEN);
    model.needsUpdates.push(carb_oh);
    
    for (let i = 1; i < 4; i++) {
        let hydro = makeSAtom('H');
        carb.addToOrbital(i, hydro, S_RADIUS);
        model.needsUpdates.push(hydro);
        let carb_hydro = new Bond(carb, hydro, FULL);
        model.needsUpdates.push(carb_hydro);
    }
    
    let chlor = new SP3Atom("Cl");
    chlor.start = new THREE.Vector3(200 * (1 - DEFAULT_LOBE_PROP), 0, 0);
    chlor.end = new THREE.Vector3(200 * (1 - DEFAULT_LOBE_PROP) + 100, 0, 0);
    chlor.position.copy(chlor.start);
    chlor.rotateY(Math.PI);
    model.add(chlor);
    
    let carb_chlor = new Bond(carb, chlor, FULL);
    model.needsUpdates.push(chlor);
    model.needsUpdates.push(carb_chlor);
    
    for (let item of model.needsUpdates) {
        // Bonds should really be added to the DOM first, so they lie behind the
        //    atoms/groups
        let elt = item.get2DElt();
        if (elt.tagName == 'text') {
            $('#svg-xfm').append(elt);
        }
        else {
            $('#svg-xfm').prepend(elt);
        }
        item.update2D(new THREE.Quaternion());
    }

    model.t = 0;
    model.setT = function(newT, revQuat) {
        model.t = newT;
        oh.position.lerpVectors(oh.start, oh.end, newT);
        chlor.position.lerpVectors(chlor.start, chlor.end, newT);
        carb.setInsideOutness(newT);
        
        // set bond states
        if (newT < 0.4) {
            carb_oh.setState(BROKEN);
            carb_chlor.setState(FULL);
        }
        else if (newT > 0.6) {
            carb_oh.setState(FULL);
            carb_chlor.setState(BROKEN);
        }
        else {
            carb_oh.setState(PARTIAL);
            carb_chlor.setState(PARTIAL);
        }
        
        // Atoms/groups need to be updated before their bonds
        for (let item of model.needsUpdates) {
            item.update2D(revQuat);
        }
    };
    
    return model;
}

function makeModel(props) {
    let model;
    switch(props['reaction']) {
        case 'SN2':
            model = makeSN2(props);
            break;
        default:
            model = new THREE.AxesHelper(100);
    }
    return model;
}