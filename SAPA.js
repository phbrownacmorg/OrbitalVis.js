/*
 * Copyright 2018 Peter Brown <peter.brown@converse.edu>, 
 *                Lorelei Johns <ldjohns001@converse.edu>, and
 *                Alexis Turner <abturner002@converse.edu>
 *
 * This program is free software.  You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY, without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this program. If not, see
 * <http://www.gnu.org/licenses/>.
 */

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
    
    // Bonds 
    const carb_carb = new Bond(top_carb, bottom_carb, DOUBLE);
    model.needsUpdates.push(carb_carb);
    
    model.t = 0;
    model.setT = function(newT, revQuat) {
	model.t = newT;
		
	const oxyT = THREE.Math.clamp((newT - 0.1)/0.8, 0, 1);
	const zeroOneAngle = -model.xSign *
	      THREE.Math.lerp(RELAXED_ANGLE, Math.PI/3, oxyT);
		
	const insideOutnessT = THREE.Math.clamp((newT - 0.3) * (1 / 0.6), 0, 1);
	//console.log(insideOutnessT);
	const insideOutnessOffset = insideOutnessT / 2;
	const diverg = 1 - (4 * Math.pow(insideOutnessOffset, 2));
	console.log(diverg);
	bottom_carb.setInsideOutness(0.5 - insideOutnessOffset);
	bottom_carb.setP0Divergence(diverg);
	bottom_carb
	    .setZeroOneAngle(-model.xSign *
			     Math.min(Math.abs(zeroOneAngle),
				      Math.abs(bottom_carb.zeroOneAngle)), 1);
	bottom_carb.rotation.set(0, 0, -Math.PI + bottom_carb.zeroOneAngle);
	top_carb.setInsideOutness(0.5 + insideOutnessOffset);
	top_carb.setP0Divergence(diverg);        
	top_carb.setZeroOneAngle(Math.PI + model.xSign *
				 Math.min(Math.abs(zeroOneAngle),
			          	  Math.abs(top_carb.zeroOneAngle)), 1);
	top_carb.rotation.set(0, 0, -Math.PI/2 + top_carb.zeroOneAngle);
    }

}
