import type { UserRole } from 'src/libs/constants/user.constant';

/**
 * Các claim chuẩn của JWT theo RFC 7519.
 * `iat`, `exp` do thư viện sign/verify tự quản lý.
 */
export interface JwtStandardClaims {
  sub: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

/**
 * Payload của access token.
 * - `sub` = user id
 * - `role` dùng cho RolesGuard
 */
export interface JwtAccessPayload extends JwtStandardClaims {
  username: string;
  email: string;
  role: UserRole;
  type: 'access';
}

/**
 * Payload của refresh token.
 * Tách riêng để tránh nhầm access <-> refresh.
 */
export interface JwtRefreshPayload extends JwtStandardClaims {
  type: 'refresh';
  jti: string;
}

export type JwtPayload = JwtAccessPayload | JwtRefreshPayload;

/**
 * Object user gắn vào request.user sau khi validate JWT.
 * Dùng cho guards, decorators, services.
 */
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  jti?: string | null;
}

export interface RefreshAuthUser extends AuthUser {
  jti: string;
}
