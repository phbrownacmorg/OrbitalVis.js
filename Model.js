/* global THREE */

function makeAtomMaterial(name) {
    const COLORS = { C: 0x000000, Cl: 0x00dd00, H: 0xffffff, O: 0xdd0000 };
    return new THREE.MeshBasicMaterial( {
            color: COLORS[name],
            depthTest: false,
            opacity: 0.3,
            transparent: true,
            side: THREE.DoubleSide
    } );
}

class AtomGroup extends THREE.Group {
    constructor(name) {
        super();
        this.name = name;
    }
}

const S_RADIUS = 0.25;
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
        this.lobe1.position.set(-0.5 * lobeProportion, 0, 0);
        this.lobe1.rotateZ(Math.PI);
        this.add(this.lobe1);
    }
    
    addOnEnd(obj, extraDist) {
        obj.position.set(extraDist + (1.0 - this.proportion), 0, 0);
        this.add(obj);
    }
    
    setLobeProportion(newProp) {
        this.lobe1.position.set(-0.5 * newProp, 0, 0);
        this.lobe1.scale.set(newProp, newProp, newProp);
        this.lobe0.position.set(0.5 * (1 - newProp), 0, 0);
        this.lobe0.scale.set(1 - newProp, 1 - newProp, 1 - newProp);
    }
    
    static makeHalfPOrbital(scalingFactor, material) {
        const R = Math.asin(Math.PI / 12);
        const SEGS = 64;
        let geom = new THREE.ConeGeometry(R, 1, SEGS, 1, false);
        let cone = new THREE.Mesh(geom, material);
        geom = new THREE.SphereGeometry(R, SEGS, 8, 0, Math.PI*2, 
                                        Math.PI/2, Math.PI);
        let cap = new THREE.Mesh(geom, material);
        cap.translateY(-.5);
        cone.add(cap);
        cone.position.set(0.5 * scalingFactor, 0, 0);
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
        this.lobeProp = DEFAULT_LOBE_PROP; 
        
        this.orbitals = new Array();
        this.orbitals.push(new POrbital(this.lobeProp, material)); // Orbital 0

        this.zeroOneAngle = RELAXED_ANGLE;
        //this.orbNormals = new Array();
        //this.orbNormals.push(null);
        for (let i = 1; i < 4; i++) {
            this.orbitals.push(new POrbital(DEFAULT_LOBE_PROP, material));
            let axis = new THREE.Vector3(0, 0, -1);
            axis.applyAxisAngle(new THREE.Vector3(1, 0, 0), 
                                (i-1) * 2 * Math.PI/3);
            //this.orbNormals.push(axis.normalize());
            this.orbitals[i].rotateOnAxis(axis.normalize(), this.zeroOneAngle);
        }
        
        for (let orb of this.orbitals) {
            this.add(orb);
        }
    }
    
    addToOrbital(i, obj, extraDistance) {
        this.orbitals[i].addOnEnd(obj, extraDistance);
    }
    
    setLobes(newProp) {
        this.orbitals[0].setLobeProportion(newProp);
    }
}

function makeHydroxide() {
    let oxy = new SP3Atom('O');
    let hydro = makeSAtom('H');
    oxy.addToOrbital(1, hydro, S_RADIUS);
    hydro.name = '';
    oxy.name = 'HO';
    return oxy;
}

function makeSN2() {
    let model = new THREE.Group();
    
    let oh = makeHydroxide();
    oh.start = new THREE.Vector3(-2 * (1 - DEFAULT_LOBE_PROP) - 1, 0, 0);
    oh.end = new THREE.Vector3(-2 * (1 - DEFAULT_LOBE_PROP), 0, 0);
    oh.position.copy(oh.start);
    model.add(oh);
    
    let carb = new SP3Atom('C');
    //carb.rotateY(Math.PI);
    model.add(carb);
    
    for (let i = 1; i < 4; i++) {
        let hydro = makeSAtom('H');
        carb.addToOrbital(i, hydro, S_RADIUS);
    }
    
    let chlor = new SP3Atom("Cl");
    chlor.start = new THREE.Vector3(2 * (1 - DEFAULT_LOBE_PROP), 0, 0);
    chlor.end = new THREE.Vector3(2 * (1 - DEFAULT_LOBE_PROP) + 1, 0, 0);
    chlor.position.copy(chlor.start);
    chlor.rotateY(Math.PI);
    model.add(chlor);
    
    model.t = 0;
    model.setT = function(newT) {
        model.t = newT;
        oh.position.lerpVectors(oh.start, oh.end, newT);
        chlor.position.lerpVectors(chlor.start, chlor.end, newT);
        carb.setLobes((1 - newT) * DEFAULT_LOBE_PROP + newT * (1 - DEFAULT_LOBE_PROP));
    };
    
    //let axes = new THREE.AxesHelper();
    //model.add(axes);
    return model;
}

function makeModel(reaction) {
    let model;
    switch(reaction) {
        case 'SN2':
            model = makeSN2();
            break;
        default:
            model = new THREE.AxesHelper();
    }
    return model;
}