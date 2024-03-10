import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { VerifyGuard } from '@verifiers/verify.guard'
import { Wallet } from '@schemas'
import { CommunicationService, WalletService } from '@services'

@Controller('wallet')
export class WalletController {
    constructor(
        private readonly walletService: WalletService,
        private readonly communicationService: CommunicationService
    ) {}

    @Post()
    async store(@Body() data: { user: string }): Promise<Wallet> {
        const existedWallet = await this.walletService.find(data.user)
        if (existedWallet) {
            return existedWallet
        }

        const { address, publicKey } =
            await this.communicationService.generateSharedSecret(data.user)

        return this.walletService.create(data.user, address, publicKey)
    }

    @Get()
    @UseGuards(VerifyGuard)
    async findAll(): Promise<Wallet[]> {
        return this.walletService.findAll()
    }
}
