import { Controller, Get, Post, Body, Res, Session } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Response } from 'express';

import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
    constructor (
        private authService: AuthService,
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>
    ) {}

    @Get('header')
    async header(@Session() session: Record<string, any>) {
        if (!session.userId) {
            return `
                <div class="auth-header">
                    <a href="/auth/login" class="log-btn"> Iniciar sesión </a>
                    <a href="/auth/register" class="log-btn"> Registrarse </a>
                </div>
            `;
        }

        const user = await this.usersRepo.findOneBy({ id: session.userId });

        return `
            <div class="auth-header">
                <span> Hola, <strong>${user?.name}</strong></span>
                <form
                    hx-post="/auth/logout"
                    hx-target="#auth-header"
                    hx-swap="outerHTML"
                    style="display: inline;">

                    <button type="submit"> Logout </button>
                </form>
            </div>
        `;
    }

    @Get('/register')
    showRegister() {
        return `
            <h2> Register </h2>
            <form hx-post="/auth/register">
                <input name="email" type="email" placeholder="Email" required/>
                <input name="password" type="password" placeholder="Contraseña" required/>
                <input name="name" placeholder="Usuario" required/>
                <button type="submit"> Register </button>
            </form>
        `;
    }

    @Post('/register')
    async register (
        @Body() body: any,
        @Res() res: Response,
    ) {
        const user = await this.authService.register(
            body.email,
            body.password,
            body.name,
        );

        // Log in immediately
        (res.req as any).session.userId = user.id;

        return res
            .header('HX-Redirect', '/posts')
            .send();
    }

    @Get('/login')
    showLogin(
        @Session() session: Record<string, any>,
        @Res() res: Response
    ) {
        if (session.userId) return res.redirect('/posts');

        return res.send(`
            <h2> Login </h2>

            <form
                hx-post="/auth/login"
                hx-target="#login-error"
                hx-swap="innerHTML">

                <input name="email" type="email" placeholder="Email" required />
                <input name="password" type="password" placeholder="Contraseña" required />
                <button type="submit"> Login </button>
            </form>

            <div id="login-error"></div>
            <p>
                ¿No tenés cuenta? <a href="/auth/register"> Registrarse </a>
            </p>
        `);
    }

    @Post('/login')
    async login(
        @Body() body: any,
        @Session() session: Record<string, any>,
        @Res() res: Response,
    ) {
        try {
            const user = await this.authService.validateUser(body.email, body.password)

            session.userId = user.id;
            return res.header('HX-Redirect', '/posts').send();

        } catch {
            return res.send(`
                <div class="error">
                    Email o contraseña incorrectos
                </div>
            `);
        }
    }

    @Post('logout')
    logout(@Res() res: Response) {
        res.req.session.destroy(() => {
            res.clearCookie('connect.sid')
                .header('HX-Redirect', '/login')
                .send();
        });
    }
}
