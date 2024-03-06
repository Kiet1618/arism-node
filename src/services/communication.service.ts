import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SharedKeyService } from '@services';
import { HttpService } from '@nestjs/axios';
import { Wallet } from '@schemas';
import { BN, C, EC, N } from '@common';
import { lagrangeInterpolation } from '@libs/arithmetic';

@Injectable()
export class CommunicationService implements OnModuleInit {
  private currentUrl: string;
  private nodeUrls: [string];

  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
    private sharedKeyService: SharedKeyService,
  ) {}

  onModuleInit() {
    this.nodeUrls = ['12'];
    this.currentUrl = this.configService.get<string>('url').trim();
  }

  broadcastAll() {
    this.nodeUrls.map(async (url) => {
      if (this.currentUrl !== url) {
        this.httpService.axiosRef.post(
          `${this[url]}/communication/broadcast-assign-key`,
          { id: 1 },
        );
      }
    });
  }

  async generateSharedSecret(owner: string): Promise<Wallet> {
    const groupPublicKeys: string[] = [];

    // Step 1: Initialize secrets
    for (const nodeUrl of this.nodeUrls) {
      try {
        const { publicKey } = await this.httpService
          .post(`${this[nodeUrl]}/communication/init-secret`, { owner })
          .toPromise()
          .then((res) => res.data);

        groupPublicKeys.push(publicKey);
      } catch (error: any) {
        console.error(error.message);
        throw new InternalServerErrorException(
          `Error when initSecret in ${nodeUrl}`,
        );
      }
    }

    // Step 2: Get shares
    for (const nodeUrl of this.nodeUrls) {
      try {
        await this.httpService
          .post(`${this[nodeUrl]}/communication/generate-shares`, { owner })
          .toPromise();
      } catch (error: any) {
        console.error(error.message);
        throw new InternalServerErrorException(
          `Error when generateShares in ${nodeUrl}`,
        );
      }
    }

    // Step 3: Derive shared secret key
    for (const nodeUrl of this.nodeUrls) {
      try {
        await this.httpService
          .post(`${this[nodeUrl]}/communication/derive-shared-secret`, {
            owner,
          })
          .toPromise();
      } catch (error: any) {
        console.error(error.message);
        throw new InternalServerErrorException(
          `Error when deriveSharedSecret in ${nodeUrl}`,
        );
      }
    }

    // Get temporarily private instead of public
    // TODO: should not calculate private key here. Try to research aPSS
    // groupPublicKeys = groupPrivateKeys ( Trick )
    const masterPrivateKey = groupPublicKeys.reduce((pre, current) => {
      const prevFormat = BN.from(pre, 'hex');
      const currentFormat = BN.from(current, 'hex');

      return prevFormat.add(currentFormat).umod(EC.ORDER).toString('hex');
    }, '0');

    const masterPublicKey = EC.secp256k1
      .keyFromPrivate(masterPrivateKey!, 'hex')
      .getPublic('hex');

    const address = C.getAddressFromPublicKey(masterPublicKey);

    // Step 4: Store wallet information
    for (const nodeUrl of this.nodeUrls) {
      try {
        await this.httpService
          .post(`${this[nodeUrl]}/communication/store-wallet-info`, {
            address,
            owner,
            publicKey: masterPublicKey,
          })
          .toPromise();
      } catch (error: any) {
        console.error(error.message);
        throw new InternalServerErrorException(
          `Error when deriveSharedSecret in ${nodeUrl}`,
        );
      }
    }

    return { address, owner, publicKey: masterPublicKey };
  }

  async generateShares(owner: string): Promise<boolean> {
    const sharedKey = await this.sharedKeyService.findSharedKeyByOwner(owner);
    const secret = sharedKey.secret;
    const shares = [BN.from(secret, 'hex')];

    const indices: BN[] = [BN.ZERO];

    for (let nodeIndex = 0; nodeIndex < this.nodeUrls.length; nodeIndex++) {
      if (shares.length < N.LAGRANGE_THRESHOLD) {
        const randomShare: BN = EC.secp256k1.genKeyPair().getPrivate();
        const receivedShare = randomShare.toString('hex');

        // lastValueFrom
        await this.httpService
          .post(
            `${this.nodeUrls[nodeIndex]}/communication/add-received-share`,
            {
              owner,
              receivedShare,
            },
          )
          .toPromise();

        shares.push(randomShare);
        indices.push(BN.from(nodeIndex).add(BN.ONE));
      } else {
        const point = lagrangeInterpolation(
          shares,
          indices,
          BN.from(nodeIndex).add(BN.ONE),
        );

        const receivedShare = point.toString('hex');

        // lastValueFrom
        await this.httpService
          .post(
            `${this.nodeUrls[nodeIndex]}/communication/add-received-share`,
            {
              owner,
              receivedShare,
            },
          )
          .toPromise();
      }
    }

    return true;
  }
}
