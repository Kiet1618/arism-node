import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { CreateCommitmentDto } from '@dtos'
import { Commitment, CommitmentDocument } from '@schemas'

@Injectable()
export class CommitmentService {
    constructor(
        @InjectModel(Commitment.name)
        private commitmentModel: Model<CommitmentDocument>
    ) {}

    async create(
        createCommitmentDto: CreateCommitmentDto
    ): Promise<Commitment> {
        const commitment = new this.commitmentModel(createCommitmentDto)
        return commitment.save()
    }

    async findCommitment(commitment: string): Promise<Commitment> {
        return this.commitmentModel.findOne({ commitment }).exec()
    }
}
