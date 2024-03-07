import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { VerifyGuard } from '@verifier/verify.guard'
import { FindWalletDto } from '@dtos'
import { Wallet } from '@schemas'
import { CommunicationService, WalletService } from '@services'

@Controller('wallets')
export class WalletController {
	constructor(
		private readonly walletService: WalletService,
		private readonly communicationService: CommunicationService
	) {}

	@Post()
	async lookupWallet(@Body() lookupWalletDto: FindWalletDto): Promise<any> {
		const existedWallet = await this.walletService.find(
			lookupWalletDto.owner
		)
		if (existedWallet) {
			return existedWallet
		}

		const { publicKey, address } =
			await this.communicationService.generateSharedSecret(
				lookupWalletDto.owner
			)
		return this.walletService.create(
			lookupWalletDto.owner,
			publicKey,
			address
		)
	}

	@Get()
	@UseGuards(VerifyGuard)
	async findAll(): Promise<Wallet[]> {
		return this.walletService.findAll()
	}
}
