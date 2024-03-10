import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CommitmentDto, CreateCommitmentDto } from '@dtos'
import { CommitmentService } from '@services'
import { EC } from '@common'

@Controller('commitment')
export class CommitmentController {
    constructor(
        private readonly commitmentService: CommitmentService,
        private configService: ConfigService
    ) {}

    @Post()
    async createCommitment(
        @Body() data: CreateCommitmentDto
    ): Promise<CommitmentDto> {
        const { commitment, tempPublicKey } = data

        const existedCommitment =
            await this.commitmentService.findCommitment(commitment)

        if (existedCommitment) {
            throw new BadRequestException('Commitment already exists')
        }

        await this.commitmentService.create(data)

        const privateKey = this.configService.get<string>('privateKey')
        const keyPair = EC.secp256k1.keyFromPrivate(privateKey)
        const publicKey = keyPair.getPublic('hex')

        const signature = keyPair
            .sign(commitment + ',' + tempPublicKey)
            .toDER('hex')

        return { signature, publicKey }
    }
}
