export class MasterShareDto {
	readonly threshold: number

	readonly ciphertext: string

	readonly metadata: {
		iv: string
		ephemPublicKey: string
		mac: string
	}

	readonly publicKey: string
}
