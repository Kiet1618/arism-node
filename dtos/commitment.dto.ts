export class CommitmentDto {
	data: string
	signature: string
	publicKey: string

	constructor(data: string, signature: string, publicKey: string) {
		this.data = data
		this.signature = signature
		this.publicKey = publicKey
	}
}
