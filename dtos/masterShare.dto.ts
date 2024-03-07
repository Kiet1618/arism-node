export class MasterShareDto {
	readonly threshold: number

	readonly masterShare: string

	readonly metadata: {
		iv: string
		ephemPublicKey: string
		mac: string
	}

	readonly publicKey: string
}
