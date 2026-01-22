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

                <form hx-post="/auth/logout">
                    <button type="submit"> Cerrar sesión </button>
                </form>

            </div>
        `;
    }

    @Get('/register')
    showRegister() {
        return `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title> Registros </title>
                <link rel="stylesheet" href="/css/styles.css">
                <script src="https://unpkg.com/htmx.org@1.9.10"></script>
                <script src="/js/menu.js"></script>
                <script src="/js/footer.js"></script>
            </head>
            <body>
                <main class="layout-grid">
                    <div class="description-div">
                        <h2> Completa tus datos </h2>
                        <form
                            hx-post="/auth/register"
                            hx-target="#error"
                            hx-swap="innerHTML">

                            <input name="email" type="email" placeholder="Email" required autocomplete="email"/>
                            <input name="password" type="password" placeholder="Contraseña" required autocomplete="new-password"/>
                            <input name="name" placeholder="Usuario" required autocomplete="username"/>
                            <button type="submit" style="margin-top: 1rem;margin-bottom: 0.5rem;"> Registrarse </button>
                        </form>

                        <div id="error"></div>
                    </div>
                </main>
                <script> loadHeader("Registro"); loadFooter();</script>
            </body>
            </html>
        `;
    }


    @Post('/register')
    async register (
        @Body() body: any,
        @Res() res: Response,
    ) {
        try {
            const user = await this.authService.register(
                body.email,
                body.password,
                body.name,
            );

            // Log in immediately
            (res.req as any).session.userId = user.id;
            (res.req as any).session.isAdmin = user.isAdmin;

            return res
                .header('HX-Redirect', '/posts')
                .send();
        } catch (err: any) {
            return res.send(`
                    <div class="error">
                        ${err.message}
                    </div>
                `);
        }
    }

    @Get('/login')
    showLogin(
        @Session() session: Record<string, any>,
        @Res() res: Response
    ) {
        if (session.userId) return res.redirect('/posts');

        return res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title> Iniciar sesión </title>
                <link rel="stylesheet" href="/css/styles.css">
                <script src="https://unpkg.com/htmx.org@1.9.10"></script>
                <script src="/js/menu.js"></script>
                <script src="/js/footer.js"></script>
            </head>
            <body>
                <main class="layout-grid">
                    <div class="description-div">
                        <h2> Completa tus datos </h2>
                        <form
                            hx-post="/auth/login"
                            hx-target="#login-error"
                            hx-swap="innerHTML">

                            <input name="email" type="email" placeholder="Email" required />
                            <input name="password" type="password" placeholder="Contraseña" required />
                            <button type="submit" class="log-btn"> Iniciar sesión </button>
                        </form>

                        <div id="login-error"></div>
                        <p>
                            ¿No tenés cuenta? <a class="log-btn" href="/auth/register"> Registrarse </a>
                        </p>
                    </div>
                </main>
                <script> loadHeader("Iniciar sesión"); loadFooter();</script>
            </body>
            </html>
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
            session.isAdmin = user.isAdmin;
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
