import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
    @IsString()
    @IsNotEmpty()
    token!: string;
}

export class AppleAuthDto {
    @IsString()
    @IsNotEmpty()
    token!: string;
}
