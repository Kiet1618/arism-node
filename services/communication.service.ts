import { Injectable, OnModuleInit } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { Wallet } from '@schemas'
import { SecretService } from '@services'
import { BN, C, EC, N, T } from '@common'
import { lagrangeInterpolation } from '@libs/arithmetic'
import { post } from '@helpers/httpRequest'

@Injectable()
export class CommunicationService implements OnModuleInit {
	private nodes: T.Node[]

	constructor(
		private readonly httpService: HttpService,
		private readonly secretService: SecretService
	) {}

	onModuleInit() {
		this.nodes = [
			{
				id: 1,
				url: 'http://127.0.0.1:3001',
				publicKey: {
					x: 'bc38813a6873e526087918507c78fc3a61624670ee851ecfb4f3bef55d027b5a',
					y: 'ac4b21229f662a0aefdfdac21cf17c3261a392c74a8790db218b34e3e4c1d56a',
				},
			},
			{
				id: 2,
				url: 'http://127.0.0.1:3002',
				publicKey: {
					x: 'b56541684ea5fa40c8337b7688d502f0e9e092098962ad344c34e94f06d293fb',
					y: '759a998cef79d389082f9a75061a29190eec0cac99b8c25ddcf6b58569dad55c',
				},
			},
			{
				id: 3,
				url: 'http://127.0.0.1:3003',
				publicKey: {
					x: '4b5f33d7dd84ea0b7a1eb9cdefe33dbcc6822933cfa419c0112e9cbe33e84b26',
					y: '7a7813bf1cbc2ee2c6fba506fa5de2af1601a093d93716a78ecec0e3e49f3a57',
				},
			},
		]
	}

	async generateSharedSecret(owner: string): Promise<Wallet> {
		const publicKeys: string[] = []

		// Step 1: Initialize Secrets
		for (const { url } of this.nodes) {
			const { data: publicKey } = await post(
				this.httpService,
				`${url}/communication/initialize-secret`,
				{ owner }
			)

			publicKeys.push(publicKey)
		}

		// Step 2: Generate Shares
		for (const { url } of this.nodes) {
			await post(
				this.httpService,
				`${url}/communication/generate-shares`,
				{ owner }
			)
		}

		// Step 3: Derive Master Shares
		for (const { url } of this.nodes) {
			await post(
				this.httpService,
				`${url}/communication/derive-master-share`,
				{ owner }
			)
		}

		// Get temporarily private instead of public
		// TODO: should not calculate private key here. Try to research aPSS
		// publicKeys = groupPrivateKeys ( Trick )
		const masterPrivateKey = publicKeys.reduce((pre, current) => {
			const prevFormat = BN.from(pre, 'hex')
			const currentFormat = BN.from(current, 'hex')

			return prevFormat.add(currentFormat).umod(EC.ORDER).toString('hex')
		}, '0')

		const masterPublicKey = EC.secp256k1
			.keyFromPrivate(masterPrivateKey, 'hex')
			.getPublic('hex')

		const address = C.getAddressFromPublicKey(masterPublicKey)

		// Step 4: Create wallet
		for (const { url } of this.nodes) {
			await post(this.httpService, `${url}/communication/create-wallet`, {
				owner,
				address,
				publicKey: masterPublicKey,
			})
		}

		return { owner, address, publicKey: masterPublicKey }
	}

	async generateShares(owner: string): Promise<void> {
		const nodeSecret = await this.secretService.find(owner)

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
					{
						owner,
						receivedShare,
					}
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
						owner,
						receivedShare,
					}
				)
			}
		}
	}
}
