import EC from 'elliptic'
import { BN, T } from '@common'

export const secp256k1 = new EC.ec('secp256k1')

export const ORDER = secp256k1.curve.n

export const decodePublicKey = (publicKey: string): T.Point => {
    const x = BN.from(publicKey.slice(2, 66), 16)
    const y = BN.from(publicKey.slice(66), 16)

    return { x, y }
}

export const encodePublicKey = (point: T.Point): string => {
    return `04${point.x.toString(16, 64)}${point.y.toString(16, 64)}`
}

export const ellipticAddition = (p1: T.Point, p2: T.Point): T.Point => {
    const p1CurvePoint = secp256k1.curve.point(p1.x, p1.y)
    const p2CurvePoint = secp256k1.curve.point(p2.x, p2.y)
    const p3CurvePoint = p1CurvePoint.add(p2CurvePoint)

    return {
        x: p3CurvePoint.getX(),
        y: p3CurvePoint.getY(),
    }
}
