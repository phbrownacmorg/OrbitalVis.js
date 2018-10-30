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
    carb1.position.set(SP3_SP3_BOND_LENGTH, 0, 0);
    model.add(carb1);
    model.needsUpdates.push(carb1);
    
}