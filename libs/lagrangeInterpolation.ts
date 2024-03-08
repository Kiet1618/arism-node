import BN from "bn.js";
import EC from "elliptic";
import * as elliptic from "elliptic";

export const secp256k1 = new elliptic.ec("secp256k1");
// generator order value of `secp256k1` curve
export const nSecp256k1 = secp256k1.curve.n;

export function lagrangeInterpolation(shares: BN[], nodeIndices: BN[], xPoint: BN): BN | null {
    let result = new BN(0);
    if (shares.length !== nodeIndices.length) {
        return null;
    }

    const xBN = new BN(xPoint);

    for (let i = 0; i < shares.length; i++) {
        let iBN = new BN(nodeIndices[i]);
        let upper = new BN(1);
        let lower = new BN(1);

        for (let j = 0; j < shares.length; j++) {
            if (j !== i) {
                let jBN = new BN(nodeIndices[j]);

                upper = upper.mul(xBN.sub(jBN));
                upper = upper.umod(nSecp256k1);

                let temp = iBN.sub(jBN);
                temp = temp.umod(nSecp256k1);
                lower = lower.mul(temp).umod(nSecp256k1);
            }
        }

        let delta = upper.mul(lower.invm(nSecp256k1)).umod(nSecp256k1);
        delta = delta.mul(shares[i]).umod(nSecp256k1);
        result = result.add(delta).umod(nSecp256k1);
    }

    return result;
}