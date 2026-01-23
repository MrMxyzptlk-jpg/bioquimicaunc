import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
    private resend: Resend;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('RESEND_API_KEY');
        this.resend = new Resend(apiKey);
    }

    async sendFeedback(content: string, userDetails: string) {
        const apiKey = this.configService.get<string>('RESEND_API_KEY');

        try {
            await this.resend.emails.send({
                from: 'onboarding@resend.dev',
                to: ['uncbioquimica@gmail.com'],
                subject: '🔔 Nuevo Feedback - BioquimicaApp',
                html: `
                    <h3>Nuevo Mensaje de Usuario</h3>
                    <p><strong>Usuario:</strong> ${userDetails}</p>
                    <hr />
                    <p>${content}</p>
                `
            });
        } catch (error) {
            console.error('Email failed:', error);
        }
    }
}