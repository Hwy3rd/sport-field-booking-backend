import { Injectable } from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async login(loginDto: LoginDto) {}

  async register(registerDto: RegisterDto) {}

  async logout(refreshToken: string) {}

  async refreshToken(refreshToken: string, user: User) {}
}
