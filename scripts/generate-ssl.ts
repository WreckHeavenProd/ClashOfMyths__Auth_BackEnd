import * as fs from 'fs-extra';
import * as path from 'path';
import * as selfsigned from 'selfsigned';

const SECRETS_DIR = path.join(__dirname, '..', 'secrets');
const CERT_PATH = path.join(SECRETS_DIR, 'cert.pem');
const KEY_PATH = path.join(SECRETS_DIR, 'key.pem');

async function generateSslCert() {
    await fs.ensureDir(SECRETS_DIR);

    console.log('Generating Self-Signed SSL Certificate...');

    // selfsigned.generate returns a Promise in this version (based on error).
    const pems = await selfsigned.generate([{ name: 'commonName', value: 'localhost' }], {
        days: 365,
        keySize: 2048,
    } as any);

    await fs.writeFile(CERT_PATH, pems.cert);
    await fs.writeFile(KEY_PATH, pems.private);

    console.log(`Certificate generated successfully:`);
    console.log(`- Cert: ${CERT_PATH}`);
    console.log(`- Key: ${KEY_PATH}`);
}

generateSslCert().catch(console.error);
