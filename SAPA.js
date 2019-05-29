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

/**
 * Make and return a Model representing a syn-addition to a peroxyacid.
 * 
 * @param {Model} model 
 * @param {Object} props 
 */
function makeSAPA(model, props) {
    console.log('SAPA:', model.xSign);
    const top_carb = new SP3Atom('C');
    top_carb.setInsideOutness(0.5);
    top_carb.setP0Divergence(1);
    top_carb.position.set(0, SP3_SP3_BOND_LENGTH / 2, 0);
    model.add(top_carb);
    model.needsUpdates.push(top_carb);
    
    const bottom_carb = new SP3Atom('C');
    bottom_carb.setInsideOutness(0.5);
    bottom_carb.setP0Divergence(1);
    bottom_carb.rotation.z = -Math.PI / 2;
    top_carb.addToOrbital(1, bottom_carb, SP3_SP3_BOND_LENGTH / 2);
    model.needsUpdates.push(bottom_carb);

    const bottom_H = new SAtom('H');
    bottom_carb.addToOrbital(2, bottom_H, S_RADIUS);
    model.needsUpdates.push(bottom_H);

    const top_H = new SAtom('H');
    top_carb.addToOrbital(3, top_H, S_RADIUS);
    model.needsUpdates.push(top_H);

    const ch3a = new Methyl();
    //ch3a.add(new THREE.AxesHelper(100));
    //console.log(ch3a.quaternion);
    //console.log(ch3a.rotation);
    ch3a.rotation.set(THREE.Math.degToRad(-30), Math.PI, 0);
    //Math.PI + (RELAXED_ANGLE - Math.PI/2), Math.PI, 0);
    // 3 * Math.PI/4,
    //console.log(ch3a.quaternion);
    //console.log(ch3a.rotation);
    ch3a.quat0 = ch3a.quaternion.clone();
    ch3a.quat1 = (new THREE.Quaternion()).setFromEuler(
        new THREE.Euler(THREE.Math.degToRad(-5), Math.PI, 0));
    top_carb.addToOrbital(2, ch3a, SP3_SP3_BOND_LENGTH / 2);
    model.needsUpdates.push(ch3a);

    const ch3b = new Methyl();
    //ch3b.add(new THREE.AxesHelper(100));
    ch3b.rotation.set(THREE.Math.degToRad(150), Math.PI, 0);
    ch3b.quat0 = ch3b.quaternion.clone();
    ch3b.quat1 = (new THREE.Quaternion()).setFromEuler(
        new THREE.Euler(THREE.Math.degToRad(175), Math.PI, 0));
    bottom_carb.addToOrbital(3, ch3b, SP3_SP3_BOND_LENGTH / 2);
    model.needsUpdates.push(ch3b);

    const reactive_O = new SP3Atom('O');
    //reactive_O.add(new THREE.AxesHelper(100));
    reactive_O.position.set(model.xSign * 4.85 * SP3_SP3_BOND_LENGTH / 2, 0, 0);
    reactive_O.start = reactive_O.position.clone();
    reactive_O.end = new THREE.Vector3(model.xSign * SP3_SP3_BOND_LENGTH
        * (Math.sqrt(3.0) / 2), 0, 0);
    reactive_O.rotation.set(0, 0,
        RELAXED_ANGLE / 2.0 + ((1 + model.xSign) * Math.PI / 2));
    model.add(reactive_O);
    model.needsUpdates.push(reactive_O);

    const resonance_O = new SP3Atom('O', 'O',
        15 + model.xSign * 15, 60); //-30, -60);
    resonance_O.position.copy(reactive_O.orbitals[3].orbitalToModel(
        SP3_SP3_VEC.clone()));
    //console.log('Resonance: ', resonance_O.position,
    //	reactive_O.orbitals[3].orbitalToModel(SP3_SP3_VEC.clone()));
    //console.log(resonance_O.position);
    resonance_O.rotateZ((model.xSign - 1) * (Math.PI / 2) + RELAXED_ANGLE);
    resonance_O.rotateOnWorldAxis(unitX, model.xSign * Math.PI / 6);
    resonance_O.rotateOnWorldAxis(unitY, model.xSign *
        (Math.PI - 1.5 * RELAXED_ANGLE));
    resonance_O.initialRot = resonance_O.rotation.clone();
    model.add(resonance_O);
    model.needsUpdates.push(resonance_O);

    const carbonyl_C = new SP3Atom('C', 'C'); //, -40, 0);
    carbonyl_C.position.copy(
        resonance_O.orbitals[1].orbitalToModel(SP3_SP3_VEC.clone()));
    carbonyl_C.setInsideOutness(0.5);
    carbonyl_C.setP0Divergence(1);
    carbonyl_C.rotation.set(0,
        model.xSign * ((1 + model.xSign) * Math.PI / 2
            + Math.PI / 3 - 1.5 * RELAXED_ANGLE),
        Math.PI / 2);
    model.add(carbonyl_C);
    model.needsUpdates.push(carbonyl_C);
    
    const double_bond_O = new SP3Atom('O', 'O',
        -45 + model.xSign * -15, -60); // -1:-30
    double_bond_O.position.copy(
        carbonyl_C.orbitals[1].orbitalToModel(SP3_SP3_VEC.clone()));
    double_bond_O.setInsideOutness(0.5);
    double_bond_O.setP0Divergence(1);
    double_bond_O.rotation.set(0,
        model.xSign * (Math.PI / 3 - 1.5 * RELAXED_ANGLE),
        model.xSign * Math.PI / 2);
    double_bond_O.quat0 = double_bond_O.quaternion.clone();
    double_bond_O.quat1 = (new THREE.Quaternion()).setFromEuler(
        new THREE.Euler(double_bond_O.rotation.x, double_bond_O.rotation.y,
            model.xSign * Math.PI / 2 + RELAXED_ANGLE - Math.PI / 2));
    //double_bond_O.add(new THREE.AxesHelper(100));
    model.add(double_bond_O);
    model.needsUpdates.push(double_bond_O);

    const end_H = new SAtom('H', 'H',
        -60 + model.xSign * -10, -80 + model.xSign * -20); // -50, -60
    end_H.position.copy(
        reactive_O.orbitals[2].orbitalToModel(S_SP3_VEC.clone()));
    end_H.start = end_H.position.clone();
    // No end_H.end, because the attraction is to a moving target.
    model.add(end_H);
    model.needsUpdates.push(end_H);

    const r_H = new SAtom('H', 'H', 0, 50);
    carbonyl_C.addToOrbital(2.5 + model.xSign * 0.5, r_H, S_RADIUS);
    model.needsUpdates.push(r_H);

    //bonds 
    model.needsUpdates.push(new Bond(bottom_carb, bottom_H, BACK_SLANT));
    model.needsUpdates.push(new Bond(top_carb, ch3a, BACK_SLANT));
    const carb_carb = new Bond(top_carb, bottom_carb, DOUBLE);
    model.needsUpdates.push(carb_carb);
    const bottom_carb_O = new Bond(bottom_carb, reactive_O, BROKEN);
    model.needsUpdates.push(bottom_carb_O);
    const top_carb_O = new Bond(top_carb, reactive_O, BROKEN);
    model.needsUpdates.push(top_carb_O);
    model.needsUpdates.push(new Bond(top_carb, top_H, FRONT_SLANT));
    model.needsUpdates.push(new Bond(bottom_carb, ch3b, FRONT_SLANT));
    const reactive_O_H = new Bond(reactive_O, end_H, FULL);
    model.needsUpdates.push(reactive_O_H);
    const resonance_O_reactive_O = new Bond(reactive_O, resonance_O, FULL);
    model.needsUpdates.push(resonance_O_reactive_O);
    const resonance_O_carbonyl_C = new Bond(resonance_O, carbonyl_C, FULL);
    model.needsUpdates.push(resonance_O_carbonyl_C);
    const double_bond_O_H = new Bond(double_bond_O, end_H, BROKEN);
    model.needsUpdates.push(double_bond_O_H);
    const carbonyl_C_double_bond_O = new Bond(carbonyl_C, double_bond_O, DOUBLE);
    model.needsUpdates.push(carbonyl_C_double_bond_O);
    model.needsUpdates.push(new Bond(carbonyl_C, r_H, FULL));
        
    model.t = 0;
    model.setT = function (newT, revQuat) {
        model.t = newT;

        const oxyT = THREE.Math.clamp((newT - 0.1) / 0.8, 0, 1);
        const zeroOneAngle = THREE.Math.lerp(RELAXED_ANGLE, Math.PI / 3, oxyT);
        // Left-side: 109.5 -> 60
        // Right-side: -109.5 -> -60
        let insideOutnessT = (newT - 0.3) * (1 / 0.6);
        insideOutnessT = THREE.Math.clamp(insideOutnessT, 0, 1);
        //console.log(insideOutnessT);
        const insideOutnessOffset = model.xSign * insideOutnessT / 2;
        const diverg = 1 - (4 * Math.pow(insideOutnessOffset, 2));
        //console.log(diverg);
        bottom_carb.setInsideOutness(0.5 + insideOutnessOffset);
        bottom_carb.setP0Divergence(diverg);
        bottom_carb.setZeroOneAngle(
            THREE.Math.lerp(zeroOneAngle, Math.PI - zeroOneAngle,
                bottom_carb.insideOutness), 1);
        bottom_carb.rotation.set(0, 0, -Math.PI + bottom_carb.zeroOneAngle);
        top_carb.setInsideOutness(0.5 - insideOutnessOffset);
        top_carb.setP0Divergence(diverg);
        top_carb.setZeroOneAngle(
            THREE.Math.lerp(zeroOneAngle, Math.PI - zeroOneAngle,
                top_carb.insideOutness), 1);
        top_carb.rotation.set(0, 0, -Math.PI / 2 + top_carb.zeroOneAngle);

        THREE.Quaternion.slerp(ch3a.quat0, ch3a.quat1, ch3a.quaternion,
            insideOutnessT);
        THREE.Quaternion.slerp(ch3b.quat0, ch3b.quat1, ch3b.quaternion,
            insideOutnessT);

        reactive_O.position.lerpVectors(reactive_O.start, reactive_O.end, oxyT);
        reactive_O.setZeroOneAngle(zeroOneAngle, 1);
        reactive_O.rotation.set(0, 0, (reactive_O.zeroOneAngle / 2) + (Math.PI / 2)
            (model.xSign * (Math.PI / 2)));

        // The resonance oxygen forms a double bond with the carbonyl C
        resonance_O.setInsideOutness(oxyT / 2);
        resonance_O.setP0Divergence(oxyT);
        resonance_O.rotation.set(0, 0, 0);
        resonance_O.rotateZ((model.xSign - 1) * (Math.PI / 2) +
            THREE.Math.lerp(RELAXED_ANGLE, Math.PI / 2, oxyT));
        resonance_O.rotateOnWorldAxis(unitX, model.xSign *
            THREE.Math.lerp(Math.PI / 6, 0, oxyT));
        resonance_O.rotateOnWorldAxis(unitY, model.xSign *
            (Math.PI - 1.5 * RELAXED_ANGLE));
        
        // The carbonyl C's double bond changes from the double-bond O to the
        // resonance O
        carbonyl_C.orbitals[0].rotation.x = oxyT * -model.xSign * Math.PI / 3;

        // The double-bond O loses its double bond
        double_bond_O.setInsideOutness((1 - oxyT) / 2);
        double_bond_O.setP0Divergence(1 - oxyT);
        THREE.Quaternion.slerp(double_bond_O.quat0, double_bond_O.quat1,
            double_bond_O.quaternion, oxyT);
        //double_bond_O.rotation.z = model.xSign * Math.PI/2 + 
        //    THREE.Math.lerp(0, RELAXED_ANGLE - Math.PI/2, oxyT);

        // The end hydrogen moves to its new place
        end_H.position.lerpVectors(
            end_H.start,
            double_bond_O.orbitals[3].orbitalToModel(S_SP3_VEC.clone()),
            oxyT);

        //update bonds

        if (newT < 0.23) {
            reactive_O_H.setState(FULL);
            resonance_O_reactive_O.setState(FULL);
            bottom_carb_O.setState(BROKEN);
            top_carb_O.setState(BROKEN);
            carb_carb.setState(DOUBLE);
            resonance_O_carbonyl_C.setState(FULL);
            double_bond_O_H.setState(BROKEN);
            carbonyl_C_double_bond_O.setState(DOUBLE);
        }
        else if (newT < 0.45) {
            reactive_O_H.setState(PARTIAL);
            resonance_O_reactive_O.setState(PARTIAL);
            bottom_carb_O.setState(BROKEN);
            top_carb_O.setState(BROKEN);
            carb_carb.setState(DOUBLE);
            resonance_O_carbonyl_C.setState(FULL);
            double_bond_O_H.setState(BROKEN);
            carbonyl_C_double_bond_O.setState(DOUBLE);
        }
        else if (newT < 0.7) {
            reactive_O_H.setState(BROKEN);
            resonance_O_reactive_O.setState(BROKEN);
            bottom_carb_O.setState(PARTIAL);
            top_carb_O.setState(PARTIAL);
            carb_carb.setState(FULL_PARTIAL);
            resonance_O_carbonyl_C.setState(FULL);
            double_bond_O_H.setState(PARTIAL);
            carbonyl_C_double_bond_O.setState(DOUBLE);
        }
        else if (newT < 0.8) {
            reactive_O_H.setState(BROKEN);
            resonance_O_reactive_O.setState(BROKEN);
            bottom_carb_O.setState(PARTIAL);
            top_carb_O.setState(PARTIAL);
            carb_carb.setState(FULL_PARTIAL);
            resonance_O_carbonyl_C.setState(FULL_PARTIAL);
            double_bond_O_H.setState(PARTIAL);
            carbonyl_C_double_bond_O.setState(FULL_PARTIAL);
        }
        else {
            reactive_O_H.setState(BROKEN);
            resonance_O_reactive_O.setState(BROKEN);
            bottom_carb_O.setState(FULL);
            top_carb_O.setState(FULL);
            carb_carb.setState(FULL);
            resonance_O_carbonyl_C.setState(DOUBLE);
            double_bond_O_H.setState(FULL);
            carbonyl_C_double_bond_O.setState(FULL);
        }

        // Atoms/groups need to be updated before their bonds
        for (let item of model.needsUpdates) {
            item.update2D(revQuat);
        }
    };

}
