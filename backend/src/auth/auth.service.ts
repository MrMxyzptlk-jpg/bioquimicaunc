import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService) {}

    async register(email: string, password: string, name: string) {
        const existing = await this.usersService.findByEmail(email);
        if (existing) {
            throw new BadRequestException('El email ya está en uso');
        }

        const hash = await bcrypt.hash(password, 10);

        return this.usersService.create({
            email,
            password: hash,
            name: name,
        });
    }

    async validateUser(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);

        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        return user;
    }

}
