import { Controller, Get, Req } from '@nestjs/common';

@Controller('csrf')
export class CsrfController {
    @Get()
    getToken(@Req() req: any) {
        return req.csrfToken();
    }
}
