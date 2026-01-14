import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OidcModule } from './oidc/oidc.module';
import { AppController } from './app.controller';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        OidcModule,
        AuthModule,
    ],
    controllers: [AppController],
    providers: [],
})
export class AppModule { }
