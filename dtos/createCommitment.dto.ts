import { IsNotEmpty, IsString } from 'class-validator'
import { Date } from 'mongoose'

export class CreateCommitmentDto {
	@IsNotEmpty()
	readonly commitment: string

	@IsNotEmpty()
	readonly tempPublicKey: string
}
