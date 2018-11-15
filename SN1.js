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
/* global S_RADIUS */
/* global S_SP3_BOND_LENGTH */
/* global SP3_SP3_BOND_LENGTH */

/* global Ethyl */
/* global Methyl */
/* global Water */

/* global THREE */

function makeSN1(model, props) {
    const MAX_WITHDRAWAL = 50 * SP3_SP3_BOND_LENGTH;
    let water;
    if (model.xSign === -1) { // Left-side attack
        water = new Water('H2O');
    }
    else if (model.xSign === 1) { // Right-side attack
        water = new Water('OH2');
        water.rotation.set(0, Math.PI, 0);
    }
    
    water.start = new THREE.Vector3(model.xSign * MAX_WITHDRAWAL, 0, 0);
    water.mid = new THREE.Vector3(model.xSign * (2 * SP3_SP3_BOND_LENGTH + 100),
				  0, 0);
    water.end = new THREE.Vector3(model.xSign * 2 * SP3_SP3_BOND_LENGTH, 0, 0);
    water.position.copy(water.start);
    model.add(water);
    model.needsUpdates.push(water);
    //console.log(water);

    const chlor = new SP3Atom('Cl');
    chlor.rotation.set(0, Math.PI, 0);
    chlor.start = water.end.clone().multiplyScalar(model.xSign);
    chlor.mid = water.mid.clone().multiplyScalar(model.xSign);
    chlor.end = water.start.clone().multiplyScalar(model.xSign);
    chlor.position.copy(chlor.start);
    model.add(chlor);
    model.needsUpdates.push(chlor);
    
    const carb = new SP3Atom('C');
    model.add(carb);
    model.needsUpdates.push(carb);

    const hydro = new SAtom('H');
    carb.addToOrbital(3, hydro, S_RADIUS);
    model.needsUpdates.push(hydro);

    const ethyl = new Ethyl();
    ethyl.rotation.set(Math.PI/2, 0, Math.PI);
    ethyl.add(new THREE.AxesHelper(100));
    carb.addToOrbital(1, ethyl, SP3_SP3_BOND_LENGTH);
    model.needsUpdates.push(ethyl);

    const ch3 = new Methyl();
    ch3.rotation.set(Math.PI/6, 0, Math.PI);
    carb.addToOrbital(2, ch3, SP3_SP3_BOND_LENGTH);
    model.needsUpdates.push(ch3);

    // Make the Bonds
    const carb_water = new Bond(carb, water, BROKEN);
    model.needsUpdates.push(carb_water);
    const carb_hydro = new Bond(carb, hydro, FRONT_SLANT);
    model.needsUpdates.push(carb_hydro);
    const carb_ethyl = new Bond(carb, ethyl, FULL);
    model.needsUpdates.push(carb_ethyl);
    const carb_ch3 = new Bond(carb, ch3, BACK_SLANT);
    model.needsUpdates.push(carb_ch3);
    const carb_chlor = new Bond(carb, chlor, FULL);
    model.needsUpdates.push(carb_chlor);

    model.t = 0;
    model.setT = function(newT, revQuat) {
	model.t = newT;

	// Set the inside-outness of the main carbon
	if (model.t < 0.35) {
	    carb.setInsideOutness(Math.max(0, (0.5/0.3) * (model.t - 0.05)));
	}
	else if (model.t < 0.65) {
	    carb.setInsideOutness(0.5);
	}
	else {
	    carb.setInsideOutness(
		Math.max(
		    0, Math.min(
			1.0, -model.xSign * (0.5/0.3) * (model.t-0.65) + 0.5)));
	    //console.log(model.t, model.xSign, carb.insideOutness);
	}

	// Set the position of the water
	if (model.t > 0.65) {
	    water.position.lerpVectors(water.mid, water.end,
				       Math.min(1, (model.t - 0.65)/0.3));
	}
	else {
	    water.position.lerpVectors(water.start, water.mid,
				       Math.pow((model.t/0.65), 0.5));
	    //console.log(model.t, Math.min(1, model.t/0.65), water);
	}
	
	// Set the position of the Cl
	if (model.t < 0.35) {
	    chlor.position.lerpVectors(chlor.start, chlor.mid,
				       Math.max(0, (model.t - 0.05)/0.3));
	}
	else {
	    chlor.position.lerpVectors(chlor.mid, chlor.end,
				       Math.pow((model.t - 0.35)/0.65, 2));
	}
	
	// Update the bonds
	if (model.t < 0.06) {  // Initial state
	    carb_water.setState(BROKEN);
	    carb_chlor.setState(FULL);
	}
	else if (model.t > 0.94) {  // Final state
	    carb_water.setState(FULL);
	    carb_chlor.setState(BROKEN);
	}
	else if (model.t < 0.36) { // Early intermediate
	    carb_water.setState(BROKEN);
	    carb_chlor.setState(PARTIAL);
	}
	else if (model.t > 0.64) { // Late intermediate
	    carb_water.setState(PARTIAL);
	    carb_chlor.setState(BROKEN);
	}
	else { // Middle intermediate
	    carb_water.setState(BROKEN);
	    carb_chlor.setState(BROKEN);
	}

	// Atoms/groups need to be updated before their bonds
        for (let item of model.needsUpdates) {
            item.update2D(revQuat);
        }	
    }

    model.add(new THREE.AxesHelper(100));  
}
