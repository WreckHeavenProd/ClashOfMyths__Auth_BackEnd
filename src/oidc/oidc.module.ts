import { Module, Global } from '@nestjs/common';
import { KeyManagerService } from './key-manager.service';
import { OidcController } from './oidc.controller';

@Global()
@Module({
    controllers: [OidcController],
    providers: [KeyManagerService],
    exports: [KeyManagerService],
})
export class OidcModule { }
