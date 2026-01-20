import { ArgumentsHost, Catch, ExceptionFilter, UnauthorizedException } from "@nestjs/common";
import type { Response } from 'express';

@Catch(UnauthorizedException)
export class AuthExceptionFilter implements ExceptionFilter {
    catch(exception: UnauthorizedException, host: ArgumentsHost) {
        const res = host.switchToHttp().getResponse<Response>();

        res.header('HX-Redirect', '/auth/login')
            .status(403)
            .send();
    }
}