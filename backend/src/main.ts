import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import csrf from 'csurf';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AuthExceptionFilter } from './auth/auth-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });

    app.useGlobalFilters(new AuthExceptionFilter());

    app.set('trust proxy', 1);

    app.use(
        session({
            secret: process.env.SESSION_SECRET ?? 'dev-secret',
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                maxAge: 1000 * 60 * 60 * 24,
            },
        }),
    );

    app.use(csrf());

    app.useGlobalPipes(new ValidationPipe({
        transform: true,
        whitelist: true,
    }));

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
