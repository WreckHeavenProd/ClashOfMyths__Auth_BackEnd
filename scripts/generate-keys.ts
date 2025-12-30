import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';

const SECRETS_DIR = path.join(__dirname, '..', 'secrets');

async function generateKeys() {
    await fs.ensureDir(SECRETS_DIR);

    const keyId = crypto.randomUUID();
    console.log(`Generating RSA Key Pair (kid: ${keyId})...`);

    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        },
    });

    const timestamp = Date.now();
    const privatePath = path.join(SECRETS_DIR, `${timestamp}_${keyId}.private.pem`);
    const publicPath = path.join(SECRETS_DIR, `${timestamp}_${keyId}.public.pem`);

    await fs.writeFile(privatePath, privateKey);
    await fs.writeFile(publicPath, publicKey);

    console.log(`Keys generated successfully:`);
    console.log(`- Private: ${privatePath}`);
    console.log(`- Public: ${publicPath}`);
}

generateKeys().catch(console.error);
