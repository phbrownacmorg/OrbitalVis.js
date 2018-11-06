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

function makeE2(model, props) {
    const MAX_WITHDRAWAL = 5 * SP3_SP3_BOND_LENGTH;

    const carb1 = new SP3Atom('C');
    // 0 orbital interacts with the leaving H,
    // and eventually forms the pi-bond.
    carb1.position.set(-SP3_SP3_BOND_LENGTH, 0, 0);
    carb1.rotation.set(0, 0, RELAXED_ANGLE);
    model.add(carb1);
    model.needsUpdates.push(carb1);
    
    const carb2 = new SP3Atom('C');
    // 0 orbital interacts with the leaving Cl,
    // and eventually forms the pi-bond.
    carb2.position.set(SP3_SP3_BOND_LENGTH, 0, 0);
    carb2.rotation.set(0, 0, Math.PI + RELAXED_ANGLE);
    model.add(carb2);
    model.needsUpdates.push(carb2);
    
    const hydro2 = new SAtom('H');
    // Figure out the position of hydro2 relative to the center of carb1
    hydro2.position.set((-1/3.0), Math.sin(RELAXED_ANGLE), 0);
    hydro2.position.multiplyScalar(SP3_SP3_BOND_LENGTH + S_RADIUS);
    // Add in the position of carb1 to find the absolute position    
    hydro2.position.add(carb1.position);
    hydro2.start = hydro2.position.clone();
    hydro2.bind = hydro2.start.clone().setX(hydro2.start.x - 0.5 * S_SP3_BOND_LENGTH);
    // Offset from OH group after bond is formed
    hydro2.offset = new THREE.Vector3(S_SP3_BOND_LENGTH, 0, 0);
    model.add(hydro2);
    model.needsUpdates.push(hydro2);
    
    const oh = new Hydroxide();
    oh.position.set(-2 * MAX_WITHDRAWAL, hydro2.position.y, 0);
    oh.rotation.set(Math.PI, 0, 0);
    oh.start = oh.position.clone();
    oh.close1 = oh.start.clone().setX(hydro2.start.x - 1.5 * S_SP3_BOND_LENGTH - S_RADIUS);
    oh.close2 = oh.close1.clone().setX(oh.close1.x + S_RADIUS);
    model.add(oh);
    model.needsUpdates.push(oh);

    const hydro1 = new SAtom('H');
    carb1.addToOrbital(2, hydro1, S_RADIUS);
    model.needsUpdates.push(hydro1);
    
    // Bonds
    const carb1_carb2 = new Bond(carb1, carb2, FULL);
    model.needsUpdates.push(carb1_carb2);
    const carb1_hydro1 = new Bond(carb1, hydro1, BACK_SLANT);
    model.needsUpdates.push(carb1_hydro1);
    
    model.setT = function(newT, revQuat) {
        model.t = newT;
        
        // Set the proportions of each carbon's 
        // orbital 0
        const t0 =
            THREE.Math.clamp((newT - 0.05)/0.9,
                            0, 1);
        //console.log(t0);
        const insideOutness = Math.min(0.5, t0/2);
        carb1.setInsideOutness(insideOutness);
        carb2.setInsideOutness(insideOutness);
        // Set the divergence angle of each carbon's
        // orbital 0
        const divergence = 2 * insideOutness;
        carb1.setP0Divergence(divergence);
        carb2.setP0Divergence(divergence);

        carb1.rotation.set(0, 0,
            THREE.Math.lerp(RELAXED_ANGLE,                                     Math.PI/2, t0));
        carb2.rotation.set(0, 0, 
                           Math.PI + carb1.rotation.z);
        
        if (newT < 0.4) {
            oh.position.lerpVectors(oh.start, oh.close1, newT/0.4);
            hydro2.position.copy(hydro2.start);
        }
        else if (newT < 0.5) {
            oh.position.lerpVectors(oh.close1, oh.close2, 
                                    (newT - 0.4)/0.1);
            hydro2.position.lerpVectors(hydro2.start, hydro2.bind,
                                        (newT - 0.4)/0.1);
        }
        else if (newT < 0.6) {
            oh.position.lerpVectors(oh.close2, oh.close1,
                                    (newT - 0.5)/0.1);
            hydro2.position.addVectors(oh.position, hydro2.offset);
        }
        else {
            oh.position.lerpVectors(oh.close1, oh.start, (newT-0.6)/0.4);
            hydro2.position.addVectors(oh.position, hydro2.offset);
        }
    };
    
    model.add(new THREE.AxesHelper(100));
}