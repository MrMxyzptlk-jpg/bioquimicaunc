import { Controller, Get, Post, Body, Res, Session } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor (private authService: AuthService) {}

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
                <input name="password" type="password" placeholder="Contreseña" required />
                <button type="submit"> Login </button>
            </form>

            <div id="login-error"></div>
            <p>
                ¿No tenés cuenta? <a href="/auth/register"> Registrarse </>
            </p>
        `);
    }

    @Post('/login')
    async login(
        @Body() body: any,
        @Session() session: Record<string, any>,
        @Res() res: Response,
    ) {
        const user = await this.authService.validateUser(body.email, body.password)

        if (!user) {
            return res.send(`
                <div class="error">
                    Email o contraseña incorrectos
                </div>
            `);
        }

        session.userId = user.id;

        return res.header('HX-Redirect', '/posts').send();
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
