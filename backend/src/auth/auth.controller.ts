import { Controller, Get, Post, Body, Res } from '@nestjs/common';
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
    showLogin() {
        return `
            <h2> Login </h2>
            <form hx-post="/auth/login">
                <input name="email" type="email" placeholder="Email" required />
                <input name="password" type="password" placeholder="Contreseña" required />
                <button type="submit"> Login </button>
            </form>
        `;
    }

    @Post('/login')
    async login(@Body() body: any, @Res() res: Response) {
        try {
            const user = await this.authService.validateUser(
                body.email,
                body.password
            );

            // Create session
            (res.req as any).session.userId = user.id

            return res
                .header('HX-Redirect', '/posts')
                .send();
        } catch {
            return res.status(401).send(`
                    <div style="color: red; margin-top: 10px;">
                        Email o contraseña incorrectos
                    </div>
                `);
        }
    }
}
