import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import * as jose from 'jose';

@Injectable()
export class KeyManagerService implements OnModuleInit {
    private readonly logger = new Logger(KeyManagerService.name);
    private readonly secretsDir = path.join(process.cwd(), 'secrets');
    private keys: Map<string, { privateKeyPem: string; publicKey: crypto.KeyObject; kid: string }> = new Map();

    async onModuleInit() {
        await this.loadKeys();
    }

    async loadKeys() {
        this.logger.log(`Loading keys from ${this.secretsDir}...`);
        try {
            if (!await fs.pathExists(this.secretsDir)) {
                this.logger.warn('Secrets directory not found. No keys loaded.');
                return;
            }

            const files = await fs.readdir(this.secretsDir);
            // Filter private keys: timestamp_uuid.private.pem
            const privateKeyFiles = files.filter(f => f.endsWith('.private.pem')).sort().reverse();

            for (const file of privateKeyFiles) {
                // Filename format: {timestamp}_{kid}.private.pem
                const match = file.match(/^(\d+)_(.+)\.private\.pem$/);
                if (!match) continue;

                const kid = match[2];
                const privatePath = path.join(this.secretsDir, file);
                const publicPath = path.join(this.secretsDir, file.replace('.private.pem', '.public.pem'));

                if (!await fs.pathExists(publicPath)) {
                    this.logger.warn(`Public key missing for ${file}, skipping.`);
                    continue;
                }

                const privatePem = await fs.readFile(privatePath, 'utf8');
                const publicPem = await fs.readFile(publicPath, 'utf8');

                const publicKey = crypto.createPublicKey(publicPem);

                this.keys.set(kid, { privateKeyPem: privatePem, publicKey, kid });
                this.logger.log(`Loaded key kid=${kid}`);
            }
        } catch (error) {
            this.logger.error('Failed to load keys', error);
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
