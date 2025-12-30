import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        const isJest = typeof process.env.JEST_WORKER_ID !== 'undefined';
        const databaseUrl = process.env.DATABASE_URL;
        const connectionString = databaseUrl ?? (isJest ? 'postgresql://localhost:5432/postgres' : undefined);

        if (!connectionString) {
            throw new Error('DATABASE_URL is not set');
        }

        const adapter = new PrismaPg({ connectionString });
        super({ adapter } as any);
    }

    async onModuleInit() {
        if (typeof process.env.JEST_WORKER_ID !== 'undefined') {
            return;
        }
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}