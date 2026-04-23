import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { USER_STATUS } from 'src/libs/constants/user.constant';
import {
  JwtAccessPayload,
  JwtPayload,
  JwtStandardClaims,
  JwtRefreshPayload,
  RefreshAuthUser,
} from 'src/libs/types/jwt-payload.type';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
} from 'src/libs/constants/token.constent';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  private getTokenExpiryDate(token: string): Date {
    const decoded = this.jwtService.decode(token);
    if (
      !decoded ||
      typeof decoded === 'string' ||
      typeof decoded.exp !== 'number'
    ) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }
    return new Date(decoded.exp * 1000);
  }

  private getJwtId(token: string): string {
    const decoded = this.jwtService.decode<JwtPayload>(token);
    if (
      !decoded ||
      typeof decoded === 'string' ||
      typeof (decoded as JwtStandardClaims).jti !== 'string'
    ) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }
    return (decoded as JwtStandardClaims).jti as string;
  }

  private async generateAccessToken(user: User) {
    const payload: JwtAccessPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      type: 'access',
    };

    return await this.jwtService.signAsync(payload);
  }

  private async generateRefreshToken(user: User) {
    const payload: JwtRefreshPayload = {
      sub: user.id,
      type: 'refresh',
      jti: randomUUID(),
    };

    return await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: (this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN') ??
        REFRESH_TOKEN_TTL) as any,
    });
  }

  async login(loginDto: LoginDto) {
    const { identifier, password } = loginDto;

    const user = await this.userService.findByIdentifier(identifier);
    if (!user) {
      throw new UnauthorizedException('Invalid identifier or password');
    } else if (user.status === USER_STATUS.DELETED) {
      throw new UnauthorizedException('User account has been deleted');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid identifier or password');
    }

    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const refreshTokenExpiresAt = this.getTokenExpiryDate(refreshToken);

    await this.sessionRepository.save({
      userId: user.id,
      refreshToken: hashedRefreshToken,
      jti: this.getJwtId(refreshToken),
      expiresAt: refreshTokenExpiresAt,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async register(registerDto: RegisterDto) {
    const { username, password, email } = registerDto;

    const { usernameTaken, emailTaken } =
      await this.userService.checkDuplicateUsernameEmail(
      username,
      email,
    );
    if (usernameTaken && emailTaken) {
      throw new BadRequestException('Username and email already exist');
    }
    if (usernameTaken) {
      throw new BadRequestException('Username already exists');
    }
    if (emailTaken) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return await this.userService.userCreate({
      username,
      password: hashedPassword,
      email,
      fullName: registerDto.fullName,
      phone: registerDto.phone,
    });
  }

  async logout(refreshToken: string) {
    const jti = this.getJwtId(refreshToken);
    const session = await this.sessionRepository.findOne({
      where: {
        jti,
        revokedAt: IsNull(),
      },
    });

    if (!session) return;

    const isMatched = await bcrypt.compare(refreshToken, session.refreshToken);
    if (!isMatched) return;

    session.revokedAt = new Date();
    await this.sessionRepository.save(session);
  }

  async refreshToken(refreshToken: string, authUser: RefreshAuthUser) {
    const user = await this.userService.findById(authUser.id);
    if (!user || user.status === USER_STATUS.DELETED) {
      throw new UnauthorizedException('Invalid token');
    }

    const matchedSession = await this.sessionRepository.findOne({
      where: {
        userId: user.id,
        jti: authUser.jti,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!matchedSession) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isMatched = await bcrypt.compare(
      refreshToken,
      matchedSession.refreshToken,
    );
    if (!isMatched) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newAccessToken = await this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user);
    const newHashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);

    matchedSession.refreshToken = newHashedRefreshToken;
    matchedSession.jti = this.getJwtId(newRefreshToken);
    matchedSession.expiresAt = this.getTokenExpiryDate(newRefreshToken);
    matchedSession.revokedAt = null;
    await this.sessionRepository.save(matchedSession);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
