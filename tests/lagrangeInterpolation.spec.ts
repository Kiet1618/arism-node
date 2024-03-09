import { lagrangeInterpolation } from '@libs/arithmetic'
import { BN, T } from '@common'

describe('Lagrange Interpolation', () => {
    it('first degree polynomial', () => {
        const points: T.Point[] = [
            { x: BN.from(1), y: BN.from(5) },
            { x: BN.from(2), y: BN.from(13) },
        ]

        const result = lagrangeInterpolation(points, BN.ZERO)

        console.log(result.toString())

        expect(result).toEqual(16)
    })

    it('second degree polynomial', () => {
        const points: T.Point[] = [
            { x: BN.from(1), y: BN.from(5) },
            { x: BN.from(2), y: BN.from(13) },
            { x: BN.from(3), y: BN.from(29) },
        ]

        const result = lagrangeInterpolation(points, BN.ZERO)

        console.log(result.toString())

        expect(result).toEqual(0)
    })
})
