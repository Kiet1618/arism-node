import {
    Body,
    Controller,
    InternalServerErrorException,
    Post,
} from '@nestjs/common'
import { SecretService, WalletService, CommunicationService } from '@services'
import { ReceiveShareDto, CreateWalletDto } from '@dtos'
import { EC } from '@common'

@Controller('communication')
export class CommunicationController {
    constructor(
        private secretService: SecretService,
        private walletService: WalletService,
        private communicationService: CommunicationService
    ) {}

    @Post('initialize-secret')
    async initializeSecret(@Body() data: { user: string }): Promise<any> {
        try {
            const secret = await this.secretService.initialize(data.user)
            const keyPair = EC.secp256k1.keyFromPrivate(secret)
            const publicKey = keyPair.getPublic().encode('hex', false)
            return publicKey
        } catch (error) {
            console.error(error.message)
            throw new InternalServerErrorException(
                'Error when secretService.initialize'
            )
        }
    }

    @Post('generate-shares')
    async generateShares(@Body() data: { user: string }): Promise<void> {
        try {
            await this.communicationService.generateShares(data.user)
        } catch (error) {
            console.error(error.message)
            throw new InternalServerErrorException(
                'Error when communicationService.generateShares'
            )
        }
    }

    @Post('receive-share')
    async receiveShare(@Body() data: ReceiveShareDto): Promise<void> {
        try {
            await this.secretService.receiveShare(data.user, data.receivedShare)
        } catch (error) {
            console.error(error.message)
            throw new InternalServerErrorException(
                'Error when secretService.receiveShare'
            )
        }
    }

    @Post('derive-master-share')
    async deriveMasterShare(@Body() data: { user: string }): Promise<void> {
        try {
            await this.secretService.deriveMasterShare(data.user)
        } catch (error) {
            console.error(error.message)
            throw new InternalServerErrorException(
                'Error when secretService.deriveMasterShare'
            )
        }
    }

    @Post('create-wallet')
    async createWallet(@Body() data: CreateWalletDto): Promise<void> {
        try {
            await this.walletService.create(
                data.user,
                data.address,
                data.publicKey
            )
        } catch (error) {
            console.error(error.message)
            throw new InternalServerErrorException(
                'Error when walletService.create'
            )
        }
    }
}
