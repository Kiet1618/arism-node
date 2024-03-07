import { IsNotEmpty, IsString } from 'class-validator'

export class FindWalletDto {
	@IsNotEmpty()
	readonly owner: string

	readonly address: string

	readonly publicKey: string
}
