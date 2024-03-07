import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type WalletDocument = HydratedDocument<Wallet>

@Schema({ timestamps: true })
export class Wallet {
	@Prop({ required: true, lowercase: true, trim: true })
	owner: string

	@Prop()
	address: string

	@Prop()
	publicKey: string

	constructor(owner: string, address: string, publicKey: string) {
		this.owner = owner
		this.address = address
		this.publicKey = publicKey
	}
}

export const WalletSchema = SchemaFactory.createForClass(Wallet)
