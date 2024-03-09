import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Wallet, WalletDocument } from '@schemas'

@Injectable()
export class WalletService {
	constructor(
		@InjectModel(Wallet.name) private walletModel: Model<WalletDocument>
	) {}

	async findAll(): Promise<Wallet[]> {
		return this.walletModel.find().exec()
	}

	async find(owner: string): Promise<Wallet> {
		return this.walletModel.findOne({ owner }).exec()
	}

	async create(
		owner: string,
		address: string,
		publicKey: string
	): Promise<Wallet> {
		const wallet = new Wallet(owner, address, publicKey)
		return this.walletModel.create(wallet)
	}
}
