/* global Bond */
/* global BROKEN */
/* global FULL */
/* global PARTIAL */
/* global BACK_SLANT */
/* global FRONT_SLANT */

/* global SAtom */
/* global RELAXED_ANGLE */
/* global S_RADIUS */
/* global SP3Atom */
/* global SP3_SP3_BOND_LENGTH */

/* global Hydroxide */
/* global Methyl */

/* global THREE */

function makeE1(model, props) {
    const MAX_WITHDRAWAL = 5 * SP3_SP3_BOND_LENGTH;

    const carb1 = new SP3Atom('C');
    carb1.position.set(-SP3_SP3_BOND_LENGTH, 0, 0);
    carb1.rotation.set(0, 0, carb1.zeroOneAngle);
    model.add(carb1);
    model.needsUpdates.push(carb1);

    const carb2 = new SP3Atom('C');
    carb2.position.set(SP3_SP3_BOND_LENGTH, 0, 0);
    carb2.rotation.set(0, 0, carb2.zeroOneAngle + Math.PI);
    model.add(carb2);
    model.needsUpdates.push(carb2);

    //carb1.add(new THREE.AxesHelper(100 * (1 - DEFAULT_LOBE_PROP) + S_RADIUS));
    const hydro2 = new SAtom('H');
    // Start it out at carb1's position
    hydro2.position.copy(carb1.position);
    // Move it out orbital 0 the proper distance
    hydro2.position.add(
	new THREE.Vector3(100 * (1-DEFAULT_LOBE_PROP) + S_RADIUS, 0, 0)
	    .applyQuaternion(carb1.quaternion));
    model.add(hydro2);
    model.needsUpdates.push(hydro2);
    hydro2.start = hydro2.position.clone();
    hydro2.mid = hydro2.start.clone()
	.add(new THREE.Vector3(-S_SP3_BOND_LENGTH/2, 0, 0));
    hydro2.end = hydro2.start.clone()
	.setX(-1.25 * MAX_WITHDRAWAL + S_SP3_BOND_LENGTH);
    
    const hydro1 = new SAtom('H');
    carb1.addToOrbital(3, hydro1, S_RADIUS);
    model.needsUpdates.push(hydro1);

    const meth3 = new Methyl();
    meth3.rotation.set(-7 * Math.PI/12, 0, Math.PI);
    carb2.addToOrbital(3, meth3, SP3_SP3_BOND_LENGTH);
    model.needsUpdates.push(meth3);

    const chlor = new SP3Atom('Cl');
    chlor.rotation.set(0, 0, Math.PI);
    carb2.addToOrbital(0, chlor, SP3_SP3_BOND_LENGTH);
    chlor.start = chlor.position.clone();
    chlor.mid = chlor.start.clone().add(new THREE.Vector3(35, 0, 0));
    chlor.end = chlor.mid.clone().add(new THREE.Vector3(MAX_WITHDRAWAL, 0, 0));
    model.needsUpdates.push(chlor);

    const meth1 = new Methyl();
    meth1.rotation.set(0, 0, Math.PI);
    carb1.addToOrbital(2, meth1, SP3_SP3_BOND_LENGTH);
    model.needsUpdates.push(meth1);
    
    const meth2 = new Methyl();
    meth2.rotation.set(0, 0, Math.PI);
    carb2.addToOrbital(2, meth2, SP3_SP3_BOND_LENGTH);
    model.needsUpdates.push(meth2);
    
    const oh = new Hydroxide('HO');
    oh.position.set(-1.25 * MAX_WITHDRAWAL, hydro2.start.y, 0);
    oh.start = oh.position.clone();
    oh.mid1 = hydro2.mid.clone().add(new THREE.Vector3(-S_SP3_BOND_LENGTH,
						       0, 0));
    oh.mid2 = oh.mid1.clone().add(new THREE.Vector3(S_RADIUS, 0, 0));
    oh.end = hydro2.end.clone().add(new THREE.Vector3(-S_SP3_BOND_LENGTH,
						      0, 0));
    model.add(oh);
    model.needsUpdates.push(oh);

    // Add the Bonds

    const hydro2_oh = new Bond(hydro2, oh, BROKEN);
    const carb1_carb2 = new Bond(carb1, carb2, FULL);
    const carb1_meth1 = new Bond(carb1, meth1, BACK_SLANT);
    const carb1_hydro1 = new Bond(carb1, hydro1, FRONT_SLANT);
    const carb1_hydro2 = new Bond(carb1, hydro2, FULL);
    const carb2_chlor = new Bond(carb2, chlor, FULL);
    const carb2_meth3 = new Bond(carb2, meth3, BACK_SLANT);
    const carb2_meth2 = new Bond(carb2, meth2, FRONT_SLANT);

    model.needsUpdates.push(hydro2_oh);
    model.needsUpdates.push(carb1_carb2);
    model.needsUpdates.push(carb1_meth1);
    model.needsUpdates.push(carb1_hydro1);
    model.needsUpdates.push(carb1_hydro2);
    model.needsUpdates.push(carb2_chlor);
    model.needsUpdates.push(carb2_meth3);
    model.needsUpdates.push(carb2_meth2);
    
    // Do the animation
    
    model.t = 0;
    model.setT = function(newT, revQuat) {
	model.t = newT;

	carb1.setInsideOutness(Math.min(0.5,
					Math.max(0, (model.t-0.55) * 1.25)));
	carb1.setP0Divergence(2 * carb1.insideOutness);
	carb1.rotation.set(0, 0, carb1.zeroOneAngle);
	
	carb2.setInsideOutness(Math.min(0.5,
					Math.max(0, (model.t-0.05) * 1.25)));
	carb2.setP0Divergence(2 * carb2.insideOutness);
	carb2.rotation.set(0, 0, carb2.zeroOneAngle + Math.PI);

	if (model.t < 0.45) {
	    chlor.position.lerpVectors(chlor.start, chlor.mid,
				       Math.max(0, (model.t - 0.45)/0.45));
	}
	else {
	    chlor.position.lerpVectors(chlor.mid, chlor.end,
				       (model.t - 0.45) / 0.55);
	}

	if (model.t < 0.5) {
	    hydro2.position.copy(hydro2.start);
	    oh.position.copy(oh.start);
	}
	else if (model.t < 0.6) {
	    hydro2.position.copy(hydro2.start);
	    oh.position.lerpVectors(oh.start, oh.mid1, (model.t - 0.5)/0.1);
	}
	else if (model.t < 0.75) {
	    hydro2.position.lerpVectors(hydro2.start, hydro2.mid,
					(model.t - 0.6)/0.3);
	    oh.position.lerpVectors(oh.mid1, oh.mid2, (model.t - 0.6)/0.15);
	}
	else if (model.t < 0.9) {
	    hydro2.position.lerpVectors(hydro2.start, hydro2.mid,
					(model.t - 0.6)/0.3);
	    oh.position.lerpVectors(oh.mid2, oh.mid1, (model.t - 0.75)/0.15);
	}
	else {
	    const alpha = (model.t - 0.9)/0.1;
	    hydro2.position.lerpVectors(hydro2.mid, hydro2.end, alpha);
	    oh.position.lerpVectors(oh.mid1, oh.end, alpha);
	}
	
	// Update the Bonds
	if (model.t < 0.12) { // Initial
	    hydro2_oh.setState(BROKEN);
	    carb1_carb2.setState(FULL);
	    carb1_hydro2.setState(FULL);
	    carb2_chlor.setState(FULL);
	}
	else if (model.t < 0.46) { // Intermediate 1
	    hydro2_oh.setState(BROKEN);
	    carb1_carb2.setState(FULL);
	    carb1_hydro2.setState(FULL);
	    carb2_chlor.setState(PARTIAL);
	}
	else if (model.t < 0.7) { // Intermediate 2
	    hydro2_oh.setState(BROKEN);
	    carb1_carb2.setState(FULL);
	    carb1_hydro2.setState(FULL);
	    carb2_chlor.setState(BROKEN);
	}
	else if (model.t < 0.91) { // Intermediate 3
	    hydro2_oh.setState(PARTIAL);
	    carb1_carb2.setState(FULL_PARTIAL);
	    carb1_hydro2.setState(PARTIAL);
	    carb2_chlor.setState(BROKEN);
	}
	else {                     // Final
	    hydro2_oh.setState(FULL);
	    carb1_carb2.setState(DOUBLE);
	    carb1_hydro2.setState(BROKEN);
	    carb2_chlor.setState(BROKEN);
	}

        // Atoms/groups need to be updated before their bonds
        for (let item of model.needsUpdates) {
            item.update2D(revQuat);
        }	
    }
    
    model.add(new THREE.AxesHelper(100));
}
