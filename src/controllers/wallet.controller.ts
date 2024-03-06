import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { FindWalletDto } from '@dtos/findWallet.dto';
import { Wallet } from '@schemas';
import { WalletService } from '@services';
import { VerifyGuard } from '@verifier/verify.guard';

@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  async lookupWallet(@Body() lookupWalletDto: FindWalletDto): Promise<any> {
    const existedWallet = await this.walletService.find(lookupWalletDto.owner);
    if (existedWallet) {
      return existedWallet;
    }

    const { publicKey, address } = await this.grpcService.generateSharedSecret(
      lookupWalletDto.owner,
    );
    return this.walletService.create(lookupWalletDto.owner, publicKey, address);
  }

  @Get()
  @UseGuards(VerifyGuard)
  async findAll(): Promise<Wallet[]> {
    return this.walletService.findAll();
  }
}
