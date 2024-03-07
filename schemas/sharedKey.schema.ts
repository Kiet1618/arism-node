import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type SharedKeyDocument = HydratedDocument<SharedKey>

@Schema({ timestamps: true })
export class SharedKey {
	@Prop({ type: Types.ObjectId, ref: 'Wallet' })
	walletId: string

	@Prop()
	secret: string

	@Prop()
	owner: string

	@Prop()
	receivedShares: [string]

	@Prop()
	sharedSecret: string
}

export const SharedKeySchema = SchemaFactory.createForClass(SharedKey)
