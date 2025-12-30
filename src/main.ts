import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const httpsEnabled = process.env.HTTPS_ENABLED === 'true';
    let httpsOptions;

    if (httpsEnabled) {
        const keyPath = process.env.SSL_KEY_PATH || './secrets/key.pem';
        const certPath = process.env.SSL_CERT_PATH || './secrets/cert.pem';

        if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
            httpsOptions = {
                key: fs.readFileSync(keyPath),
                cert: fs.readFileSync(certPath),
            };
            logger.log(`HTTPS Enabled. Loading certs from ${certPath}`);
        } else {
            logger.warn(`HTTPS Enabled but certs not found at ${certPath}. Falling back to HTTP.`);
        }
    }

    const app = await NestFactory.create(AppModule, {
        httpsOptions,
    });

    const config = new DocumentBuilder()
        .setTitle('COM API')
        .setVersion('1.0')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const protocol = httpsOptions ? 'https' : 'http';
    await app.listen(3000);
    logger.log(`Application is running on: ${protocol}://localhost:3000`);
}
bootstrap();
