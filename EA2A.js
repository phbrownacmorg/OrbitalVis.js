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

    bottom_H = makeSAtom('H');
    bottom_carb.addToOrbital(2, bottom_H, S_RADIUS);
    model.needsUpdates.push(bottom_H);

    // Bonds
    const carb_carb = new Bond(top_carb, bottom_carb, DOUBLE);
    model.needsUpdates.push(carb_carb);
    // Not BACK_SLANT?
    const bottom_carb_H = new Bond(bottom_carb, bottom_H, FULL); 
    model.needsUpdates.push(bottom_carb_H);
    
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

	// Update the bonds
	if (model.t < 0.23) {
	    carb_carb.setState(DOUBLE);
	}
	else if (model.t > 0.5) {
	    carb_carb.setState(FULL);
	}
	else {
	    carb_carb.setState(FULL_PARTIAL);
	}
	
        // Atoms/groups need to be updated before their bonds
        for (let item of model.needsUpdates) {
            item.update2D(revQuat);
        }	
    }
    
    return model;
}
