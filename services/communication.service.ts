import {
	Injectable,
	InternalServerErrorException,
	OnModuleInit,
} from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { Wallet } from '@schemas'
import { SecretService } from '@services'
import { BN, C, EC, N } from '@common'
import { lagrangeInterpolation } from '@libs/lagrangeInterpolation'
import { catchError, firstValueFrom, last, lastValueFrom } from 'rxjs'

@Injectable()
export class CommunicationService implements OnModuleInit {
	private nodeUrls: string[]

	constructor(
		private readonly httpService: HttpService,
		private readonly secretService: SecretService
	) { }

	onModuleInit() {
		this.nodeUrls = [
			'http://127.0.0.1:3001',
			'http://127.0.0.1:3002',
			'http://127.0.0.1:3003',
		]
	}

	async generateSharedSecret(owner: string): Promise<Wallet> {
		const groupPublicKeys: string[] = []

		// Step 1: Initialize secrets
		for (const nodeUrl of this.nodeUrls) {
			const { data: publicKey } = await firstValueFrom(
				this.httpService
					.post(`${nodeUrl}/communication/initialize-secret`, {
						owner,
					})
					.pipe(
						catchError((error: any) => {
							console.error(error.message)
							throw new InternalServerErrorException(
								`Error when initialize-secret in ${nodeUrl}`
							)
						})
					)
			)

			groupPublicKeys.push(publicKey)
		}

		// Step 2: Get shares
		for (const nodeUrl of this.nodeUrls) {
			await firstValueFrom(
				this.httpService
					.post(`${nodeUrl}/communication/generate-shares`, {
						owner,
					})
					.pipe(
						catchError((error: any) => {
							console.error(error.message)
							throw new InternalServerErrorException(
								`Error when generate-shares in ${nodeUrl}`
							)
						})
					)
			)
		}

		// Step 3: Derive shared secret key
		for (const nodeUrl of this.nodeUrls) {
			await firstValueFrom(
				this.httpService
					.post(`${nodeUrl}/communication/derive-master-share`, {
						owner,
					})
					.pipe(
						catchError((error: any) => {
							console.error(error.message)
							throw new InternalServerErrorException(
								`Error when derive-master-share in ${nodeUrl}`
							)
						})
					)
			)
		}

		// Get temporarily private instead of public
		// TODO: should not calculate private key here. Try to research aPSS
		// groupPublicKeys = groupPrivateKeys ( Trick )
		const masterPrivateKey = groupPublicKeys.reduce((pre, current) => {
			const prevFormat = BN.from(pre, 'hex')
			const currentFormat = BN.from(current, 'hex')

			return prevFormat.add(currentFormat).umod(EC.ORDER).toString('hex')
		}, '0')

		const masterPublicKey = EC.secp256k1
			.keyFromPrivate(masterPrivateKey, 'hex')
			.getPublic('hex')

		const address = C.getAddressFromPublicKey(masterPublicKey)

		// Step 4: Store wallet information
		for (const nodeUrl of this.nodeUrls) {
			await firstValueFrom(
				this.httpService
					.post(`${nodeUrl}/communication/create-wallet`, {
						address,
						owner,
						publicKey: masterPublicKey,
					})
					.pipe(
						catchError((error: any) => {
							console.error(error.message)
							throw new InternalServerErrorException(
								`Error when create-wallet in ${nodeUrl}`
							)
						})
					)
			)
		}

		return { address, owner, publicKey: masterPublicKey }
	}

	async generateShares(owner: string): Promise<void> {
		const nodeSecret = await this.secretService.find(owner)

		const secret = nodeSecret.secret
		const generatedShares = [BN.from(secret, 'hex')]
		const xValues: BN[] = [BN.ZERO]

		for (let nodeIndex = 0; nodeIndex < this.nodeUrls.length; nodeIndex++) {
			if (generatedShares.length < N.LAGRANGE_THRESHOLD) {
				const randomShare: BN = EC.secp256k1.genKeyPair().getPrivate()
				const receivedShare = randomShare.toString('hex')

				await lastValueFrom(
					this.httpService
						.post(
							`${this.nodeUrls[nodeIndex]}/communication/receive-share`,
							{
								owner,
								receivedShare,
							}
						)
						.pipe(
							catchError((error: any) => {
								console.error(error.message)
								throw new InternalServerErrorException(
									`Error when receive-share in ${this.nodeUrls[nodeIndex]}`
								)
							})
						)
				)

				generatedShares.push(randomShare)
				xValues.push(BN.from(nodeIndex).add(BN.ONE))

			} else {
				const point = lagrangeInterpolation(
					generatedShares,
					xValues,
					BN.from(nodeIndex).add(BN.ONE)
				)

				const receivedShare = point.toString('hex')

				await lastValueFrom(
					this.httpService
						.post(
							`${this.nodeUrls[nodeIndex]}/communication/receive-share`,
							{
								owner,
								receivedShare,
							}
						)
						.pipe(
							catchError((error: any) => {
								console.error(error.message)
								throw new InternalServerErrorException(
									`Error when receive-share in ${this.nodeUrls[nodeIndex]}`
								)
							})
						)
				)
			}
		}
	}
}
