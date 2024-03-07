import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { SharedKey, SharedKeyDocument } from 'schemas'
import { BN, EC } from 'common'

@Injectable()
export class SharedKeyService {
	constructor(
		@InjectModel(SharedKey.name)
		private sharedKeyModel: Model<SharedKeyDocument>
	) {}

	async initialize(owner: string): Promise<string> {
		const keyPair = EC.secp256k1.genKeyPair()
		const secret = keyPair.getPrivate('hex')
		const publicKey = keyPair.getPrivate('hex')
		await this.sharedKeyModel.create({ secret, owner })
		return publicKey
	}

	async find(owner: string): Promise<SharedKey> {
		return this.sharedKeyModel.findOne({ owner })
	}

	async updateReceivedShare(
		owner: string,
		receivedShare: string
	): Promise<boolean> {
		const sharedKey = await this.sharedKeyModel.findOne({ owner })
		sharedKey.receivedShares.push(receivedShare)
		await this.sharedKeyModel.updateOne(
			{ owner },
			{ receivedShares: sharedKey.receivedShares }
		)
		return true
	}

	async addReceivedShare(
		walletId: string,
		receivedShare: string
	): Promise<void> {
		const sharedKey: SharedKey = await this.sharedKeyModel.findOne({
			walletId,
		})
		sharedKey.receivedShares.push(receivedShare)
		await this.sharedKeyModel.updateOne(
			{ walletId },
			{ receivedShares: sharedKey.receivedShares }
		)
	}

	async deriveSecretSharedKey(owner: string): Promise<boolean> {
		const sharedKey: SharedKey = await this.sharedKeyModel.findOne({
			owner,
		})
		const sharedSecret = sharedKey.receivedShares.reduce(
			(prev, current) => prev.add(BN.from(current, 'hex')).umod(EC.ORDER),
			BN.ZERO
		)
		try {
			await this.sharedKeyModel.updateOne(
				{ owner },
				{ sharedSecret: sharedSecret.toString('hex') }
			)
			return true
		} catch (error) {
			return false
		}
	}
}
