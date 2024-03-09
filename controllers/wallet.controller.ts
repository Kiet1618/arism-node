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
    async store(@Body() data: { owner: string }): Promise<Wallet> {
        const existedWallet = await this.walletService.find(data.owner)
        if (existedWallet) {
            return existedWallet
        }

        const { address, publicKey } =
            await this.communicationService.generateSharedSecret(data.owner)

        return this.walletService.create(data.owner, address, publicKey)
    }

    @Get()
    @UseGuards(VerifyGuard)
    async findAll(): Promise<Wallet[]> {
        return this.walletService.findAll()
    }
}
