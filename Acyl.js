/* global Bond */
/* global BROKEN */
/* global PARTIAL */
/* global FULL */
/* global FULL_PARTIAL */
/* global DOUBLE */
/* global BACK_SLANT */
/* global FRONT_SLANT */

/* global SAtom */
/* global SP3Atom */
/* global RELAXED_ANGLE */
/* global S_SP3_BOND_LENGTH */
/* global SP3_SP3_BOND_LENGTH */

/* global Ethyl */
/* global Methyl */

/* global THREE */

function makeAcyl(model, props) {
    
    const nucleophile = new SAtom('H');
    nucleophile.start = new THREE.Vector3(model.xSign * (S_SP3_BOND_LENGTH + 80), 0, 0);
    nucleophile.end = new THREE.Vector3(model.xSign * S_SP3_BOND_LENGTH, 0, 0);
    nucleophile.position.copy(nucleophile.start);
    model.add(nucleophile);
    model.needsUpdates.push(nucleophile);
    
    const carb = new SP3Atom('C');
    carb.setInsideOutness(0.5);
    carb.setP0Divergence(1);
    carb.rotateX(Math.PI);
    model.add(carb);
    model.needsUpdates.push(carb);
    
    const oxy = new SP3Atom('O');
    oxy.setInsideOutness(0.5);
    oxy.setP0Divergence(1);
    //oxy.add(new THREE.AxesHelper(100));
    oxy.rotation.z = -Math.PI/2;
    carb.addToOrbital(1, oxy, SP3_SP3_BOND_LENGTH/2);
    model.needsUpdates.push(oxy);
    
    const ch3 = new Methyl();
    //ch3.add(new THREE.AxesHelper(30));
    ch3.setInsideOutness(1.0);
    ch3.rotateX(1.5 * RELAXED_ANGLE + 0.25 * Math.PI);  // Roll an H straight down
    carb.addToOrbital(3, ch3, SP3_SP3_BOND_LENGTH/2);
    model.needsUpdates.push(ch3);

    const ethyl = new Ethyl();
    ethyl.setInsideOutness(1.0);
    ethyl.rotateX(1.5 * RELAXED_ANGLE + 0.25 * Math.PI);
    carb.addToOrbital(2, ethyl, SP3_SP3_BOND_LENGTH/2);
    model.needsUpdates.push(ethyl);
        
    // Add the bonds
    const nucleophile_carb = new Bond(nucleophile, carb, BROKEN);
    model.needsUpdates.push(nucleophile_carb);
    const carb_ethyl = new Bond(carb, ethyl, FRONT_SLANT);
    model.needsUpdates.push(carb_ethyl);
    const carb_ch3 = new Bond(carb, ch3, BACK_SLANT);
    model.needsUpdates.push(carb_ch3);
    const carb_oxy = new Bond(carb, oxy, DOUBLE);
    model.needsUpdates.push(carb_oxy);

    model.t = 0;
    model.setT = function(newT, revQuat) {
        model.t = newT;
        // Set the angles betwen the carbon's orbitals, and the proportion of its center orbital
        const insideOutnessOffset = -model.xSign * 
            Math.max(0, Math.min(0.5, ((0.5/0.6) * (newT - 0.3))));
        const insideOutness = 0.5 + insideOutnessOffset;
        const divergence = 1.0 - (4 * (insideOutness - 0.5) * (insideOutness - 0.5));
        carb.setInsideOutness(insideOutness);
        carb.setP0Divergence(divergence);
        oxy.setInsideOutness(insideOutness);
        oxy.setP0Divergence(divergence);
        oxy.rotation.z = -Math.PI/2 - (Math.PI/2 - oxy.zeroOneAngle);
        
        // nucleophile moves in
        nucleophile.position.lerpVectors(nucleophile.end, nucleophile.start, 
                                         Math.max(0, 0.8 - newT)/0.8);
        
        // Update the bond states
        if (model.t < 0.3) {
            nucleophile_carb.setState(BROKEN);
	    carb_oxy.setState(DOUBLE);
        }
        else if (model.t > 0.5) {
            nucleophile_carb.setState(FULL);
	    carb_oxy.setState(FULL);
        }
        else {
            nucleophile_carb.setState(PARTIAL);
	    carb_oxy.setState(FULL_PARTIAL);
        }
        
        // Atoms/groups need to be updated before their bonds
        for (let item of model.needsUpdates) {
            item.update2D(revQuat);
        }
    }
    
    //model.add(new THREE.AxesHelper(100));
}
