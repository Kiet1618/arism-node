import { toChecksumAddress } from 'web3-utils'
import * as Crypto from 'eccrypto'
import { BN, EC, H } from 'common'

export const decrypt = (
	privateKey: Buffer,
	opts: Crypto.Ecies
): Promise<Buffer> => {
	return Crypto.decrypt(privateKey, opts)
}

export const encrypt = (
	publicKeyTo: Buffer,
	msg: Buffer,
	opts?: Crypto.Ecies | undefined
): Promise<Crypto.Ecies> => {
	return Crypto.encrypt(publicKeyTo, msg, opts)
}

export const getPublicKey = (privateKey: Buffer): Buffer => {
	return Crypto.getPublic(privateKey)
}

export const getAddressFromPrivateKey = (privateKey: BN): string => {
	const key = EC.secp256k1.keyFromPrivate(
		privateKey.toString('hex', 64),
		'hex'
	)
	const publicKey = key.getPublic().encode('hex', false).slice(2)
	const lowercaseAddress = `0x${H.keccak256(
		Buffer.from(publicKey, 'hex')
	).slice(64 - 38)}`
	return toChecksumAddress(lowercaseAddress)
}

export const getAddressFromPublicKey = (publicKey: string): string => {
	const formatedPublicKey = publicKey.slice(2)
	const publicKeyBytes = Buffer.from(formatedPublicKey, 'hex')

	const hash = H.keccak256(publicKeyBytes)
	const address = hash.slice(-40)

	const hashAddress = H.keccak256(address).slice(2)

	let checksumAddress = '0x'

	for (let i = 0; i < address.length; i++) {
		if (parseInt(hashAddress[i], 16) >= 8) {
			checksumAddress += address[i].toUpperCase()
		} else {
			checksumAddress += address[i]
		}
	}

	return checksumAddress
}

export const generatePrivateKey = (): Buffer => {
	return Crypto.generatePrivate()
}
