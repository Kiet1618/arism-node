import {
    BadRequestException,
    Body,
    Controller,
    Post,
    UseGuards,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { VerifyGuard } from '@verifiers/verify.guard'
import { FindMasterShareDto, MasterShareDto } from '@dtos'
import { CommitmentService, SecretService, WalletService } from '@services'
import { C, EC, H } from '@common'

@Controller('secret')
export class SecretController {
    constructor(
        private readonly secretService: SecretService,
        private readonly commitmentService: CommitmentService,
        private readonly walletService: WalletService,
        private readonly configService: ConfigService
    ) {}

    @Post()
    @UseGuards(VerifyGuard)
    async findMasterShare(
        @Body() data: FindMasterShareDto
    ): Promise<MasterShareDto> {
        const { idToken, tempPublicKey, commitments, user } = data

        const hashedIdToken = H.keccak256(idToken)
        const existedCommitment =
            await this.commitmentService.findCommitment(hashedIdToken)
        if (!existedCommitment) {
            throw new BadRequestException(
                "Commitment of Id Token doesn't exist."
            )
        }

        const wallet = await this.walletService.find(user)
        if (!wallet) {
            throw new BadRequestException('Wallet have not init yet.')
        }

        const nodePrivateKey = this.configService.get<string>('privateKey')
        const keyPair = EC.secp256k1.keyFromPrivate(nodePrivateKey)
        const publicKey = keyPair.getPublic('hex')

        const commitment = commitments.find(
            (node) => node.publicKey === publicKey
        )
        if (!commitment) {
            throw new BadRequestException(
                'Commitment does not contain in this node'
            )
        }

        const secret = await this.secretService.find(user)
        if (!secret) {
            throw new BadRequestException('Not found secret by user')
        }

        const { masterShare } = secret
        const { mac, ciphertext, iv, ephemPublicKey } = await C.encrypt(
            Buffer.from(tempPublicKey, 'hex'),
            Buffer.from(masterShare)
        )

        return {
            publicKey: wallet.publicKey,
            threshold: 1,
            ciphertext: ciphertext.toString('hex'),
            metadata: {
                mac: mac.toString('hex'),
                iv: iv.toString('hex'),
                ephemPublicKey: ephemPublicKey.toString('hex'),
            },
        }
    }
}
