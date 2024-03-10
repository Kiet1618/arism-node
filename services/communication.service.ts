import { Injectable, OnModuleInit } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { Wallet } from '@schemas'
import { SecretService } from '@services'
import { BN, C, EC, N, T } from '@common'
import { lagrangeInterpolation } from '@libs/arithmetic'
import { post } from '@helpers/httpRequest'
import { ellipticAddition, encodePublicKey } from '@common/secp256k1'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class CommunicationService implements OnModuleInit {
    private nodes: T.Node[]

    constructor(
        private readonly httpService: HttpService,
        private readonly secretService: SecretService,
        private readonly configService: ConfigService
    ) {}

    onModuleInit() {
        this.nodes = this.configService.get<T.Node[]>('nodes')
    }

    async generateSharedSecret(user: string): Promise<Wallet> {
        const publicKeys: string[] = []

        // Step 1: Initialize Secrets
        for (const { url } of this.nodes) {
            const { data: publicKey } = await post(
                this.httpService,
                `${url}/communication/initialize-secret`,
                { user }
            )

            publicKeys.push(publicKey)
        }

        // Step 2: Generate Shares
        for (const { url } of this.nodes) {
            await post(
                this.httpService,
                `${url}/communication/generate-shares`,
                { user }
            )
        }

        // Step 3: Derive Master Shares
        for (const { url } of this.nodes) {
            await post(
                this.httpService,
                `${url}/communication/derive-master-share`,
                { user }
            )
        }

        let decodeMasterPublicKey: T.Point = EC.decodePublicKey(publicKeys[0])
        for (let i = 1; i < publicKeys.length; i += 1) {
            decodeMasterPublicKey = ellipticAddition(
                decodeMasterPublicKey,
                EC.decodePublicKey(publicKeys[i])
            )
        }
        const masterPublicKey = encodePublicKey(decodeMasterPublicKey)
        const address = C.getAddressFromPublicKey(masterPublicKey)

        // Step 4: Create wallet
        for (const { url } of this.nodes) {
            await post(this.httpService, `${url}/communication/create-wallet`, {
                user,
                address,
                publicKey: masterPublicKey,
            })
        }

        return { user, address, publicKey: masterPublicKey }
    }

    async generateShares(user: string): Promise<void> {
        const nodeSecret = await this.secretService.find(user)

        const secret = nodeSecret.secret
        const generatedShares: T.Point[] = [
            {
                x: BN.ZERO,
                y: BN.from(secret, 'hex'),
            },
        ]

        for (const { url, id } of this.nodes) {
            if (generatedShares.length < N.DERIVATION_THRESHOLD) {
                const randomShare: BN = EC.secp256k1.genKeyPair().getPrivate()
                const receivedShare = randomShare.toString('hex')

                await post(
                    this.httpService,
                    `${url}/communication/receive-share`,
                    { user, receivedShare }
                )

                generatedShares.push({
                    x: BN.from(id),
                    y: randomShare,
                })
            } else {
                const receivedShare = lagrangeInterpolation(
                    generatedShares,
                    BN.from(id)
                ).toString('hex')

                await post(
                    this.httpService,
                    `${url}/communication/receive-share`,
                    {
                        user,
                        receivedShare,
                    }
                )
            }
        }
    }
}
