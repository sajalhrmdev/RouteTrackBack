import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { authRepository } from '../repositories/auth.repository';
import { companyRepository } from '../repositories/company.repository';
import { AppError, UnauthorizedError, ConflictError } from '../utils/errors';
import { AuthPayload, JwtTokens, LoginResponse } from '../types';
import { generateEmployeeId } from '../utils/helpers';
import { prisma } from '../config/database';
import { Role } from '@prisma/client';

export class AuthService {
  async register(email: string, password: string, name: string, companyName: string): Promise<LoginResponse> {
    const existingUser = await authRepository.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const existingCompany = await companyRepository.findByEmail(email);
    if (existingCompany) {
      throw new ConflictError('Company with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const company = await prisma.$transaction(async (tx) => {
      const newCompany = await tx.company.create({
        data: {
          name: companyName,
          email,
        },
      });

      await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'COMPANY_ADMIN',
          companyId: newCompany.id,
        },
      });

      await tx.department.create({
        data: {
          name: 'General',
          description: 'General Department',
          companyId: newCompany.id,
        },
      });

      await tx.designation.create({
        data: {
          name: 'Employee',
          description: 'General Employee',
          companyId: newCompany.id,
        },
      });

      return newCompany;
    });

    const user = await authRepository.findUserByEmail(email);
    if (!user) throw new AppError('Failed to create user');

    const tokens = this.generateTokens({
      userId: user.id,
      companyId: company.id,
      role: user.role as Role,
    });

    await authRepository.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: company.id,
        company: { name: companyName },
      },
      tokens,
    };
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const tokens = this.generateTokens({
      userId: user.id,
      companyId: user.companyId,
      role: user.role as Role,
    });

    await authRepository.updateRefreshToken(user.id, tokens.refreshToken);
    await authRepository.updateLastLogin(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        company: user.company ? { name: user.company.name, logo: user.company.logo } : undefined,
      },
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<JwtTokens> {
    const user = await authRepository.findUserByRefreshToken(refreshToken);
    if (!user) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as AuthPayload;
      if (decoded.userId !== user.id) {
        throw new UnauthorizedError('Invalid refresh token');
      }
    } catch {
      await authRepository.updateRefreshToken(user.id, null);
      throw new UnauthorizedError('Refresh token expired');
    }

    const tokens = this.generateTokens({
      userId: user.id,
      companyId: user.companyId,
      role: user.role as Role,
    });

    await authRepository.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await authRepository.updateRefreshToken(userId, null);
  }

  async getMe(userId: string) {
    return authRepository.findUserById(userId);
  }

  private generateTokens(payload: AuthPayload): JwtTokens {
    const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn as any,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as any,
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
