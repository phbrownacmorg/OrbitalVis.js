/* global Bond */
/* global BROKEN */
/* global FULL */
/* global PARTIAL */
/* global BACK_SLANT */
/* global FRONT_SLANT */

/* global Hydroxide */
/* global SAtom */
/* global S_RADIUS */
/* global SP3Atom */
/* global SP3_SP3_BOND_LENGTH */

/* global THREE */

function makeSN2() {
    const model = new THREE.Group();
    model.needsUpdates = [];
    
    const oh = new Hydroxide('HO');
    oh.start = new THREE.Vector3(-2 * SP3_SP3_BOND_LENGTH - 100, 0, 0);
    oh.end = new THREE.Vector3(-2 * SP3_SP3_BOND_LENGTH, 0, 0);
    oh.position.copy(oh.start);
    model.add(oh);
    model.needsUpdates.push(oh);
    
    const carb = new SP3Atom('C');
    model.add(carb);
    model.needsUpdates.push(carb);
    
    const carb_oh = new Bond(carb, oh, BROKEN);
    model.needsUpdates.push(carb_oh);
    
    for (let i = 1; i < 4; i++) {
        const hydro = new SAtom('H');
        carb.addToOrbital(i, hydro, S_RADIUS);
        model.needsUpdates.push(hydro);
        const bond_states = [undefined, FULL, BACK_SLANT, FRONT_SLANT];
        const carb_hydro = new Bond(carb, hydro, bond_states[i]);
        model.needsUpdates.push(carb_hydro);
    }
    
    const chlor = new SP3Atom("Cl");
    chlor.start = new THREE.Vector3(2 * SP3_SP3_BOND_LENGTH, 0, 0);
    chlor.end = new THREE.Vector3(2 * SP3_SP3_BOND_LENGTH + 100, 0, 0);
    chlor.position.copy(chlor.start);
    chlor.rotateY(Math.PI);
    model.add(chlor);
    
    const carb_chlor = new Bond(carb, chlor, FULL);
    model.needsUpdates.push(chlor);
    model.needsUpdates.push(carb_chlor);
    
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
