export interface PublicUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  isEmailVerified: boolean;
  status: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSession {
  user: PublicUser;
  tokens: TokenPair;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface AuthPayload {
  user: PublicUser;
  tokens: TokenPair;
}
