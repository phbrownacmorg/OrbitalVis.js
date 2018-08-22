/* global Bond */
/* global BROKEN */
/* global PARTIAL */
/* global FULL */
/* global FULL_PARTIAL */
/* global DOUBLE */
/* global BACK_SLANT */
/* global FRONT_SLANT */

/* global makeSAtom */
/* global SP3Atom */
/* global RELAXED_ANGLE */
/* global S_SP3_BOND_LENGTH */
/* global SP3_SP3_BOND_LENGTH */

/* global makeEthyl */
/* global makeMethyl */

/* global THREE */

function makeEA2A(props) {
    const model = new THREE.Group();
    model.needsUpdates = [];
    model.attackSide = props.reaction.charAt(5); // 'L' or 'R'
    model.xSign = 1; // 'R'
    if (props.reaction.charAt(5) === 'L') {
        model.xSign = -1;
    }

    const top_carb = new SP3Atom('C');
    top_carb.setInsideOutness(0.5);
    top_carb.setP0Divergence(1);
    top_carb.add(new THREE.AxesHelper(100));
    model.add(top_carb);
    model.needsUpdates.push(top_carb);

    const bottom_carb = new SP3Atom('C');
    bottom_carb.setInsideOutness(0.5);
    bottom_carb.setP0Divergence(1);
    bottom_carb.add(new THREE.AxesHelper(100));
    bottom_carb.rotation.z = -Math.PI/2;
    top_carb.addToOrbital(1, bottom_carb, SP3_SP3_BOND_LENGTH);
    model.needsUpdates.push(bottom_carb);

    const bottom_H = makeSAtom('H');
    bottom_carb.addToOrbital(2, bottom_H, S_RADIUS);
    model.needsUpdates.push(bottom_H);

    const ch3a = makeMethyl();
    ch3a.rotation.set(2*Math.PI/3, 0, Math.PI);
    top_carb.addToOrbital(2, ch3a, SP3_SP3_BOND_LENGTH);
    model.needsUpdates.push(ch3a);

    const ch3b = makeMethyl();
    ch3b.rotation.set(-2 * Math.PI/3, 0, Math.PI);
    bottom_carb.addToOrbital(3, ch3b, SP3_SP3_BOND_LENGTH);
    model.needsUpdates.push(ch3b);
   
    const new_H = makeSAtom('H');
    new_H.start = new THREE.Vector3(model.xSign * (S_SP3_BOND_LENGTH + 60),
				    0, 0);
    new_H.end = new THREE.Vector3(model.xSign * S_SP3_BOND_LENGTH, 0, 0);
    new_H.position.copy(new_H.start);
    model.add(new_H);
    model.needsUpdates.push(new_H);

    const cl = new SP3Atom('Cl');
    cl.position.setX(new_H.position.x + model.xSign * S_SP3_BOND_LENGTH);
    cl.rotateZ(Math.PI/2 + model.xSign * Math.PI/2);
    model.add(cl);
    model.needsUpdates.push(cl);

    const top_H = makeSAtom('H');
    top_carb.addToOrbital(3, top_H, S_RADIUS);
    model.needsUpdates.push(top_H);

    setRenderOrder(model);
    
    // Bonds
    const carb_carb = new Bond(top_carb, bottom_carb, DOUBLE);
    model.needsUpdates.push(carb_carb);
    // Not BACK_SLANT?
    const bottom_carb_H = new Bond(bottom_carb, bottom_H, BACK_SLANT); //x-FULL 
    model.needsUpdates.push(bottom_carb_H);
    const top_carb_ch3 = new Bond(top_carb, ch3a, BACK_SLANT); // x-FULL
    model.needsUpdates.push(top_carb_ch3);
    const bottom_carb_ch3 = new Bond(bottom_carb, ch3b, FRONT_SLANT); // x-FULL
    model.needsUpdates.push(bottom_carb_ch3);
    const top_carb_new_H = new Bond(top_carb, new_H, BROKEN);
    model.needsUpdates.push(top_carb_new_H);
    const new_H_cl = new Bond(new_H, cl, FULL);
    model.needsUpdates.push(new_H_cl);
    const top_carb_H = new Bond(top_carb, top_H, FRONT_SLANT); // x-FULL
    model.needsUpdates.push(top_carb_H);
    
    model.t = 0;
    model.setT = function(newT, revQuat) {
	model.t = newT;

	const insideOutnessOffset = -model.xSign
	      * Math.max(0, Math.min(0.5, ((0.5/0.6) * (model.t - 0.3))));
	const insideOutness = 0.5 + insideOutnessOffset;
	const divergence = 1.0
	      - (4 * (insideOutness - 0.5) * (insideOutness - 0.5));
	top_carb.setInsideOutness(insideOutness);
	top_carb.setP0Divergence(divergence);
	bottom_carb.setP0Divergence(divergence);

	new_H.position.lerpVectors(new_H.end, new_H.start,
				   Math.max(0, 0.8 - model.t)/0.8);

	// Update the bonds
	if (model.t < 0.23) {
	    carb_carb.setState(DOUBLE);
	    top_carb_new_H.setState(BROKEN);
	    new_H_cl.setState(FULL);
	}
	else if (model.t > 0.5) {
	    carb_carb.setState(FULL);
	    top_carb_new_H.setState(FULL);
	    new_H_cl.setState(BROKEN);
	}
	else {
	    carb_carb.setState(FULL_PARTIAL);
	    top_carb_new_H.setState(PARTIAL);
	    new_H_cl.setState(PARTIAL);
	}
	
        // Atoms/groups need to be updated before their bonds
        for (let item of model.needsUpdates) {
            item.update2D(revQuat);
        }	
    }
    
    return model;
}
