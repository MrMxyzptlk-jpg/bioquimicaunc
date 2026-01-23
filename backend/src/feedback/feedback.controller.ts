import { Controller, Post, Body, Session, Res, Header, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Response } from 'express';

import { EmailService } from '../email/email.service';
import { User } from '../users/entities/user.entity';
import { AuthenticatedGuard } from '../auth/authenticated.guard';

@Controller('feedback')
export class FeedbackController {
    constructor(
        private readonly emailService: EmailService,
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
    ) {}

    @Post()
    @UseGuards(AuthenticatedGuard)
    @Header('Content-Type', 'text/html')
    async handleFeedback(
        @Body('content') content: string,
        @Session() session: Record<string, any>,
        @Res() res: Response
    ) {
        const user = await this.usersRepo.findOneBy({ id: session.userId });

        if (!user) {
            return res.send('<div class="error">Error: Usuario no encontrado.</div>');
        }

        if (!content || content.trim().length < 3) {
             return res.send('<span class="error" style="color: #e74c3c;">El mensaje es muy corto.</span>');
        }

        const userInfo = `${user.name} (ID: ${user.id}, Email: ${user.email})`;
        await this.emailService.sendFeedback(content, userInfo);

        return res.send(`
            <div class="feedback-success">
                ¡Gracias ${user.name}! Tu mensaje ha sido enviado.
            </div>
        `);
    }
}