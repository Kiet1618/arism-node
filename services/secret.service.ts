import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Secret, SecretDocument } from '@schemas'
import { EC } from '@common'
import { sumMod } from '@libs/arithmetic'

@Injectable()
export class SecretService {
	constructor(
		@InjectModel(Secret.name)
		private secretModel: Model<SecretDocument>
	) {}

	async initialize(owner: string): Promise<string> {
		const keyPair = EC.secp256k1.genKeyPair()
		const secret = keyPair.getPrivate('hex')

		await this.secretModel.create({ secret, owner })

		return secret
	}

	async find(owner: string): Promise<Secret> {
		return this.secretModel.findOne({ owner })
	}

	async receiveShare(owner: string, receivedShare: string): Promise<void> {
		const nodeSecret = await this.secretModel.findOne({ owner })

		nodeSecret.receivedShares.push(receivedShare)
		const receivedShares = nodeSecret.receivedShares

		await this.secretModel.updateOne({ owner }, { receivedShares })
	}

	async deriveMasterShare(owner: string): Promise<void> {
		const nodeSecret: Secret = await this.secretModel.findOne({
			owner,
		})

		const masterShare = sumMod(nodeSecret.receivedShares, EC.ORDER)

		await this.secretModel.updateOne({ owner }, { masterShare })
	}
}
