import Web3 from 'web3'
import * as BigNumber from 'bn.js'

export type BN = BigNumber

export const ZERO = new BigNumber.BN(0)
export const ONE = new BigNumber.BN(1)

export const from = (
	value: number | string | number[] | Uint8Array | Buffer | BN,
	base?: number | 'hex',
	endian?: BigNumber.Endianness
): BN => {
	return new BigNumber.BN(value, base, endian)
}

export const to = (value: BN): string => {
	return value.toString()
}

export const randomHex = (bytes: number): string => {
	return Web3.utils.randomHex(bytes)
}
