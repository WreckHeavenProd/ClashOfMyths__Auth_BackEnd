import * as crypto from 'crypto';

async function generateKeys() {


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

    // Convert to Base64 (single line) for .env
    const privateBase64 = Buffer.from(privateKey).toString('base64');
    const publicBase64 = Buffer.from(publicKey).toString('base64');

    console.log(`\n# Copy these lines to your .env file:`);
    console.log(`OIDC_KEY_ID="${keyId}"`);
    console.log(`OIDC_PRIVATE_KEY_BASE64="${privateBase64}"`);
    console.log(`OIDC_PUBLIC_KEY_BASE64="${publicBase64}"`);
}

generateKeys().catch(console.error);
