import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import csrf from 'csurf';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AuthExceptionFilter } from './auth/auth-exception.filter';
import { HtmxThrottlerFilter } from './utils/throttler.filter';
import { HtmxExceptionFilter } from './utils/htmx-exception.filter';
import compression from 'compression';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });

    app.use(compression());

    app.useGlobalFilters(new HtmxThrottlerFilter(), new HtmxExceptionFilter(), new AuthExceptionFilter());

    app.set('trust proxy', 1);

    app.use(
        session({
            secret: process.env.SESSION_SECRET ?? 'dev-secret',
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 1000 * 60 * 60 * 24,
            },
        }),
    );

    app.use((req, res, next) => {
        if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
            return next();
        }
        return csrf()(req, res, next);
    });


    if (process.env.NODE_ENV === 'production') {
        app.disable('x-powered-by');
    }

    app.useGlobalPipes(new ValidationPipe({
        transform: true,
        whitelist: true,
    }));

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
