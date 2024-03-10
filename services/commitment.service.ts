import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Commitment, CommitmentDocument } from '@schemas'

@Injectable()
export class CommitmentService {
    constructor(
        @InjectModel(Commitment.name)
        private commitmentModel: Model<CommitmentDocument>
    ) {}

    async create(
        commitment: string,
        tempPublicKey: string
    ): Promise<Commitment> {
        return await this.commitmentModel.create({ commitment, tempPublicKey })
    }

    async find(commitment: string): Promise<Commitment> {
        return this.commitmentModel.findOne({ commitment }).exec()
    }
}
