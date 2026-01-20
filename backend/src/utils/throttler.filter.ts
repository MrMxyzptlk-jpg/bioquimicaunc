import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';
import { renderHtmxModal } from '../utils/htmx-modal';

@Catch(ThrottlerException)
export class HtmxThrottlerFilter implements ExceptionFilter {
    catch(exception: ThrottlerException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        const htmlError = renderHtmxModal(
            'Estás realizando muchas acciones seguidas. Por favor, espera unos segundos.',
            './assets/throttler-alert.svg'
        );

        response
            .status(HttpStatus.OK)
            .header('HX-Reswap', 'none')
            .send(htmlError);
    }
}
