import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get('time')
    getTime() {
        return { time: new Date().toISOString() };
    }
}
