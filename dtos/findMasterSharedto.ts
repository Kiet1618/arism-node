import { IsNotEmpty, IsString } from 'class-validator'
import { CommitmentDto } from './commitment.dto'

export class FindMasterShareDto {
	@IsNotEmpty()
	readonly owner: string

	@IsNotEmpty()
	readonly idToken: string

	@IsNotEmpty()
	readonly tempPublicKey: string

	readonly commitments: CommitmentDto[]
}
