import { ArgumentsHost, Catch, ExceptionFilter, ForbiddenException } from "@nestjs/common";
import type { Response } from 'express';

@Catch(ForbiddenException)
export class AuthExceptionFilter implements ExceptionFilter {
    catch(exception: ForbiddenException, host: ArgumentsHost) {
        const res = host.switchToHttp().getResponse<Response>();

        res.header('HX-Redirect', '/auth/login')
            .status(403)
            .send();
    }
}