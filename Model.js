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

const Z_2D_SCALE = -0.4;  // Probably only works for eye.x > 0
function vec3To2D(v) {
    // Warped parallel projection
    let result = new THREE.Vector2(v.x + Z_2D_SCALE * v.z, -v.y);
    result.z = v.z;
    return result;
}

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

            // Calculation in the plane
            if (this.bond_state === PARTIAL || this.bond_state === FULL) {
                this.path1.setAttribute('d', 
                                        'M' + start.x + ',' + start.y +
                                        ' h' + diff.length());
            }
            // Fill in the double-bond calcs later
            else if ((this.bond_state === BACK_SLANT) || (this.bond_state === FRONT_SLANT)) {
                this.path1.setAttribute('d',
                                        'M' + start.x +',' + start.y + ' ' +
                                        'l' + diff.length() + ',' + WEDGE_WIDTH + ' ' +
                                        'v' + (-2 * WEDGE_WIDTH) + ' Z');
            }
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
        this.textElt.setAttribute('y', textPos.y);
    }
}

const S_RADIUS = 25;
function makeSAtom(name) {
    let atom = new AtomGroup(name);
    let geom = new THREE.SphereGeometry(S_RADIUS, 64, 64);
    atom.add(new THREE.Mesh(geom, makeAtomMaterial(name)));
    return atom;
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
        console.log(THREE.Math.radToDeg(this.centralAngle));
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
        if (this.centralAngle !== MIN_CENTRAL_ANGLE) {
            console.log(divergenceFactor, prop);
        }
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
    constructor(name) {
        super(name);
        
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
    model.needsUpdates = [];
    
    let oh = makeHydroxide();
    oh.start = new THREE.Vector3(-2 * SP3_SP3_BOND_LENGTH - 100, 0, 0);
    oh.end = new THREE.Vector3(-2 * SP3_SP3_BOND_LENGTH, 0, 0);
    oh.position.copy(oh.start);
    model.add(oh);
    model.needsUpdates.push(oh);
    
    let carb = new SP3Atom('C');
    model.add(carb);
    model.needsUpdates.push(carb);
    
    let carb_oh = new Bond(carb, oh, BROKEN);
    model.needsUpdates.push(carb_oh);
    
    for (let i = 1; i < 4; i++) {
        let hydro = makeSAtom('H');
        carb.addToOrbital(i, hydro, S_RADIUS);
        model.needsUpdates.push(hydro);
        let bond_states = [undefined, FULL, BACK_SLANT, FRONT_SLANT];
        let carb_hydro = new Bond(carb, hydro, bond_states[i]);
        model.needsUpdates.push(carb_hydro);
    }
    
    let chlor = new SP3Atom("Cl");
    chlor.start = new THREE.Vector3(2 * SP3_SP3_BOND_LENGTH, 0, 0);
    chlor.end = new THREE.Vector3(2 * SP3_SP3_BOND_LENGTH + 100, 0, 0);
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

function makeAcyl(props) {
    let model = new THREE.Group();
    model.needsUpdates = [];
    model.attackSide = props.reaction.charAt(5); // 'L' or 'R'
    model.xSign = 1; // 'R'
    if (props.reaction.charAt(5) === 'L') {
        model.xSign = -1;
    }
    
    let nucleophile = makeSAtom('H');
    nucleophile.start = new THREE.Vector3(model.xSign * (S_SP3_BOND_LENGTH + 80), 0, 0);
    nucleophile.end = new THREE.Vector3(model.xSign * S_SP3_BOND_LENGTH, 0, 0);
    nucleophile.position.copy(nucleophile.start);
    model.add(nucleophile);
    model.needsUpdates.push(nucleophile);
    
    let carb = new SP3Atom('C');
    carb.setInsideOutness(0.5);
    carb.setP0Divergence(1);
    carb.rotateX(Math.PI);
    model.add(carb);
    model.needsUpdates.push(carb);

    model.t = 0;
    model.setT = function(newT, revQuat) {
        model.t = newT;
        // Set the angles betwen the carbon's orbitals, and the proportion of its center orbital
        let insideOutnessOffset = -model.xSign * 
            Math.max(0, Math.min(0.5, ((0.5/0.6) * (newT - 0.3))));
        let insideOutness = 0.5 + insideOutnessOffset;
        let divergence = 1.0 - (4 * (insideOutness - 0.5) * (insideOutness - 0.5));
        carb.setInsideOutness(insideOutness);
        carb.setP0Divergence(divergence);

        
        // nucleophile moves in
        nucleophile.position.lerpVectors(nucleophile.end, nucleophile.start, 
                                         Math.max(0, 0.8 - newT)/0.8);
        
        // Atoms/groups need to be updated before their bonds
        for (let item of model.needsUpdates) {
            item.update2D(revQuat);
        }
    }
    
    model.add(new THREE.AxesHelper(100));
    return model;
}


function makeModel(props) {
    let model;
    switch(props.reaction) {
        case 'SN2':
            model = makeSN2(props);
            break;
        case 'Acyl-L':
        case 'Acyl-R':
            model = makeAcyl(props);
            break;
        default:
            model = new THREE.AxesHelper(100);
    }
    return model;
}