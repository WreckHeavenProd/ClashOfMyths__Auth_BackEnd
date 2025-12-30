import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

import * as crypto from 'crypto';
import * as jose from 'jose';

@Injectable()
export class KeyManagerService implements OnModuleInit {
    private readonly logger = new Logger(KeyManagerService.name);
    private keys: Map<string, { privateKeyPem: string; publicKey: crypto.KeyObject; kid: string }> = new Map();

    async onModuleInit() {
        await this.loadKeys();
    }

    async loadKeys() {
        this.logger.log('Loading OIDC keys from environment...');

        const privateKeyBase64 = process.env.OIDC_PRIVATE_KEY_BASE64;
        const publicKeyBase64 = process.env.OIDC_PUBLIC_KEY_BASE64;
        const kid = process.env.OIDC_KEY_ID;

        if (!privateKeyBase64 || !publicKeyBase64 || !kid) {
            this.logger.warn('OIDC keys (OIDC_PRIVATE_KEY_BASE64, OIDC_PUBLIC_KEY_BASE64, OIDC_KEY_ID) not found in environment.');
            return;
        }

        try {
            const privateKeyPem = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
            const publicKeyPem = Buffer.from(publicKeyBase64, 'base64').toString('utf-8');

            const publicKey = crypto.createPublicKey(publicKeyPem);

            this.keys.set(kid, { privateKeyPem: privateKeyPem, publicKey, kid });
            this.logger.log(`Loaded key kid=${kid} from environment`);
        } catch (error) {
            this.logger.error('Failed to parse keys from environment', error);
        }
    }

    getLatestKey() {
        // Since we sorted by filename (timestamp desc) loading, the first inserted might be latest or we iterate map?
        // Map insertion order is preserved in JS. 
        // privateKeyFiles is reversed (desc), so first item is latest.
        const firstKey = this.keys.values().next().value;
        if (!firstKey) {
            throw new Error('No keys available for signing');
        }
        return firstKey;
    }

    async getJwks() {
        const keys = [];
        for (const { publicKey, kid } of this.keys.values()) {
            const jwk = await jose.exportJWK(publicKey);
            keys.push({ ...jwk, kid, use: 'sig', alg: 'RS256' });
        }
        return { keys };
    }
}
