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

    async initialize(user: string): Promise<string> {
        const keyPair = EC.secp256k1.genKeyPair()
        const secret = keyPair.getPrivate('hex')

        await this.secretModel.create({ secret, user })

        return secret
    }

    async find(user: string): Promise<Secret> {
        return this.secretModel.findOne({ user })
    }

    async receiveShare(user: string, receivedShare: string): Promise<void> {
        const secret = await this.secretModel.findOne({ user })

        secret.receivedShares.push(receivedShare)
        const receivedShares = secret.receivedShares

        await this.secretModel.updateOne({ user }, { receivedShares })
    }

    async deriveMasterShare(user: string): Promise<void> {
        const secret: Secret = await this.secretModel.findOne({
            user,
        })

        const masterShare = sumMod(secret.receivedShares, EC.ORDER)

        await this.secretModel.updateOne({ user }, { masterShare })
    }
}
