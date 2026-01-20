import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService) {}

    async register(email: string, password: string, name: string) {
        email = email.toLowerCase().trim();
        name = name.trim();

        let existing = await this.usersService.findByEmail(email);
        if (existing) throw new BadRequestException('El email ya está registrado');

        existing = await this.usersService.findByName(name);
        if (existing) throw new BadRequestException('El nombre de usuario ya existe');

        const hash = await bcrypt.hash(password, 10);

        return this.usersService.create({
            email,
            password: hash,
            name: name,
        });
    }

    async validateUser(email: string, password: string) {
        email = email.toLowerCase().trim();
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
