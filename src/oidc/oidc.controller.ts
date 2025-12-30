import { Controller, Get } from '@nestjs/common';
import { KeyManagerService } from './key-manager.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('OIDC')
@Controller('.well-known')
export class OidcController {
    constructor(private keyManager: KeyManagerService) { }

    @ApiOperation({ summary: 'Get OIDC Configuration' })
    @ApiResponse({ status: 200, description: 'OIDC Metadata' })
    @Get('openid-configuration')
    getOpenIdConfiguration() {
        const issuer = process.env.OIDC_ISSUER || 'http://localhost:3000';
        // Remove trailing slash if present to avoid double slashes in constructed URLs
        const baseUrl = issuer.replace(/\/$/, '');

        return {
            issuer: baseUrl,
            jwks_uri: `${baseUrl}/.well-known/jwks.json`,
            response_types_supported: ['id_token'],
            subject_types_supported: ['public'],
            id_token_signing_alg_values_supported: ['RS256'],
            claims_supported: ['sub', 'iss', 'aud', 'email', 'exp', 'iat', 'kid'],
        };
    }

    @ApiOperation({ summary: 'Get JSON Web Key Set (JWKS)' })
    @ApiResponse({ status: 200, description: 'Public Keys for signature verification' })
    @Get('jwks.json')
    async getJwks() {
        return this.keyManager.getJwks();
    }
}
