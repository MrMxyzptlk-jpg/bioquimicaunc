import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    ForbiddenException,
    BadRequestException,
    NotFoundException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { renderHtmxModal } from './htmx-modal';

@Catch(ForbiddenException, BadRequestException, NotFoundException)
export class HtmxExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        const message =
            typeof exception.response?.message === 'string'
                ? exception.response.message
                : Array.isArray(exception.response?.message)
                    ? exception.response.message.join('<br>')
                    : exception.message || 'Acción no permitida';

        const htmlError = renderHtmxModal(message);

        response
            .status(HttpStatus.OK)
            .header('HX-Reswap', 'none')
            .send(htmlError);
    }
}
