import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { VerifyGuard } from '@verifier/verify.guard'
import { Wallet } from '@schemas'
import { CommunicationService, WalletService } from '@services'

@Controller('wallet')
export class WalletController {
	constructor(
		private readonly walletService: WalletService,
		private readonly communicationService: CommunicationService
	) {}

	@Post()
	async lookupWallet(@Body() data: { owner: string }): Promise<Wallet> {
		const existedWallet = await this.walletService.find(data.owner)
		if (existedWallet) {
			return existedWallet
		}

		const { publicKey, address } =
			await this.communicationService.generateSharedSecret(data.owner)

		return this.walletService.create(data.owner, publicKey, address)
	}

	@Get()
	@UseGuards(VerifyGuard)
	async findAll(): Promise<Wallet[]> {
		return this.walletService.findAll()
	}
}
