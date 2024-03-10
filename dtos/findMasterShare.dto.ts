import { IsNotEmpty } from 'class-validator'
import { CommitmentDto } from '@dtos'

export class FindMasterShareDto {
    @IsNotEmpty()
    readonly user: string

    @IsNotEmpty()
    readonly idToken: string

    @IsNotEmpty()
    readonly tempPublicKey: string

    readonly commitments: CommitmentDto[]
}
