import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type WalletDocument = HydratedDocument<Wallet>

@Schema({ timestamps: true })
export class Wallet {
    @Prop({ required: true, lowercase: true, trim: true })
    user: string

    @Prop()
    address: string

    @Prop()
    publicKey: string
}

export const WalletSchema = SchemaFactory.createForClass(Wallet)
