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

/* global Methyl */

/* global THREE */

function makeSAPA(model, props) {
    const top_carb = new SP3Atom('C');
    top_carb.setInsideOutness(0.5);
    top_carb.setP0Divergence(1);
    top_carb.position.set(0, SP3_SP3_BOND_LENGTH/2.0, 0);
    model.add(top_carb);
    model.needsUpdates.push(top_carb);
    
    const bottom_carb = new SP3Atom('C');
    bottom_carb.setInsideOutness(0.5);
    bottom_carb.setP0Divergence(1);
    bottom_carb.rotation.z = -Math.PI/2;
    top_carb.addToOrbital(1, bottom_carb, SP3_SP3_BOND_LENGTH);
    model.needsUpdates.push(bottom_carb);
    
    //bonds 
    const carb_carb = new Bond(top_carb, bottom_carb, DOUBLE);
    model.needsUpdates.push(carb_carb);
    
    model.t = 0;
    model.setT = function(newT, revQuat) {
	model.t = newT;
    let insideOutnessT = (newT - 0.3) * (1 / 0.6);
    insideOutnessT =THREE.Math.clamp(insideOutnessT, 0, 1);
    //console.log(insideOutnessT);
    const insideOutnessOffset = insideOutnessT / 2;
    const diverg = 1.0 - (4 * Math.pow(insideOutnessOffset, 2));
    console.log(diverg);
    bottom_carb.setInsideOutness(0.5 - insideOutnessOffset);
    bottom_carb.setP0Divergence(diverg);
    top_carb.setInsideOutness(0.5 + insideOutnessOffset);
    top_carb.setP0Divergence(diverg);        
    }

}