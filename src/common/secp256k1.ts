import elliptic from 'elliptic';

export const secp256k1 = new elliptic.ec('secp256k1');

export const ORDER = secp256k1.curve.n;
