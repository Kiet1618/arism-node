import EC from "elliptic"
export const secp256k1 = new EC.ec("secp256k1")

export const decodePub = (pub: string): EC.curve.base.BasePoint => {
    return secp256k1.keyFromPublic(pub, "hex").getPublic()
}
export const ORDER = secp256k1.curve.n
