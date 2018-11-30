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
    top_carb.position.set(0, SP3_SP3_BOND_LENGTH, 0);
    model.add(top_carb);
    model.needsUpdates.push(top_carb);
    
    const bottom_carb = new SP3Atom('C');
    bottom_carb.setInsideOutness(0.5);
    bottom_carb.setP0Divergence(1);
    bottom_carb.rotation.z = -Math.PI/2;
    top_carb.addToOrbital(1, bottom_carb, SP3_SP3_BOND_LENGTH);
    model.needsUpdates.push(bottom_carb);
	
	top_carb.orbitals[1].orbitalToWorld();
    
    const reactive_O = new SP3Atom('O');
    reactive_O.position.set(model.xSign * 4 * SP3_SP3_BOND_LENGTH, 0, 0);
    reactive_O.rotation.set(0, 0, RELAXED_ANGLE/2.0 + (Math.PI/2 + (model.xSign * Math.PI/2)));
    reactive_O.start = reactive_O.position.clone(); 
    reactive_O.end = new THREE.Vector3(model.xSign * 2 * SP3_SP3_BOND_LENGTH * (Math.sqrt(3.0) / 2), 0, 0); 
    model.add(reactive_O);
    model.needsUpdates.push(reactive_O);
    
    //bonds 
    const carb_carb = new Bond(top_carb, bottom_carb, DOUBLE);
    model.needsUpdates.push(carb_carb);
//     const reactive_0_H = new Bond(reactive_O, end_H, FULL);
//     model.needsUpdates.push(reactive_0_H);
//     const resonance_0_reactive_0 = new Bond(reactive_O, resonance_O,  FULL);
//     model.needsUpdates.push(resonance_0_reactive_0);
    
    //update bonds
    
    
    model.t = 0;
    model.setT = function(newT, revQuat) {
		model.t = newT;
		
		const oxyT = THREE.Math.clamp((newT - 0.1)/0.8, 0, 1);
		const zeroOneAngle = -model.xSign * THREE.Math.lerp(RELAXED_ANGLE, Math.PI/3, oxyT);
		
		let insideOutnessT = (newT - 0.3) * (1 / 0.6);
		insideOutnessT = THREE.Math.clamp(insideOutnessT, 0, 1);
		//console.log(insideOutnessT);
		const insideOutnessOffset = insideOutnessT / 2;
		const diverg = 1 - (4 * Math.pow(insideOutnessOffset, 2));
		//console.log(diverg);
		bottom_carb.setInsideOutness(0.5 - insideOutnessOffset);
		bottom_carb.setP0Divergence(diverg);
		bottom_carb.setZeroOneAngle(-model.xSign * Math.min(Math.abs(zeroOneAngle), Math.abs(bottom_carb.zeroOneAngle)));
		bottom_carb.rotation.set(0, 0, -Math.PI + bottom_carb.zeroOneAngle);
		top_carb.setInsideOutness(0.5 + insideOutnessOffset);
		top_carb.setP0Divergence(diverg);        
		top_carb.setZeroOneAngle(Math.PI + model.xSign * Math.min(Math.abs(zeroOneAngle), Math.abs(top_carb.zeroOneAngle)));
		top_carb.rotation.set(0, 0, -Math.PI/2 + top_carb.zeroOneAngle);
        
        reactive_O.position.lerpVectors(reactive_O.start, reactive_O.end, oxyT);
        reactive_O.setZeroOneAngle(THREE.Math.lerp(RELAXED_ANGLE, Math.PI/3, oxyT));
        reactive_O.rotation.set(0, 0, (reactive_O.zeroOneAngle/2) + (Math.PI/2) + (model.xSign * (Math.PI/2)));
    
        
        
//         if (newT < 0.23) {
//             reactive_0_H.setState(FULL);
//             resonance_0_reactive_0.setState(FULL);
            
//         }
//         else if (newT > 0.45) {
//             reactive_0_H.setState(PARTIAL);
//             resonance_0_reactive_0.setState(PARTIAL);
//         }
//         else if (newT > 0.7) {
//             reactive_0_H.setState(BROKEN);
//             resonance_0_reactive_0.setState(BROKEN);
//         }
        
//         else if (newT > 0.8) {
//             reactive_0_H.setState(BROKEN);
//             resonance_0_reactive_0.setState(BROKEN);
//         }
//         else {
//             reactive_0_H.setState(BROKEN);
//             resonance_0_reactive_0.setState(BROKEN);
//         }
        
//         // Atoms/groups need to be updated before their bonds
//         for (let item of model.needsUpdates) {
//             item.update2D(revQuat);
//         }
    };

}