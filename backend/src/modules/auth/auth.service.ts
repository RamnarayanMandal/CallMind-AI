import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { MailService } from '../mail/mail.service';
import { AuditService } from '../audit/audit.service';
import Redis from 'ioredis';

@Injectable()
export class AuthService {
  private readonly redisClient: Redis;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
  ) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('redis.host', 'localhost'),
      port: this.configService.get<number>('redis.port', 6379),
      password: this.configService.get<string>('redis.password') || undefined,
    });
  }

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 12);
    
    const user = await this.userModel.create({ 
      ...dto, 
      password: hashed,
      isEmailVerified: false,
    });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in Redis with 10-minute expiry (600 seconds)
    await this.redisClient.set(`signup_otp:${dto.email}`, otp, 'EX', 600);

    try {
      await this.mailService.sendVerificationOtp(user.email, otp);
    } catch (emailError: any) {
      console.warn(`Failed to send verification OTP to ${user.email}. SMTP Error:`, emailError.message);
    }

    return { message: 'OTP sent successfully. Please verify your account.' };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new UnauthorizedException('User not found');
    
    const key = `signup_otp:${email}`;
    const savedOtp = await this.redisClient.get(key);
    
    if (!savedOtp) {
      throw new UnauthorizedException('OTP has expired or is invalid. Please request a new one.');
    }
    
    if (savedOtp !== otp) {
      throw new UnauthorizedException('Invalid OTP code');
    }
    
    user.isEmailVerified = true;
    await user.save();
    
    await this.redisClient.del(key);
    
    return { message: 'Email verified successfully. You can now log in.' };
  }

  async resendOtp(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.isEmailVerified) throw new ConflictException('Email is already verified');
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await this.redisClient.set(`signup_otp:${email}`, otp, 'EX', 600);
    
    try {
      await this.mailService.sendVerificationOtp(user.email, otp);
    } catch (emailError: any) {
      console.warn(`Failed to send OTP to ${user.email}. SMTP Error:`, emailError.message);
    }
    
    return { message: 'A new OTP has been sent to your email.' };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email }).select('+password');
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email address before logging in. We have sent a verification email.');
    }

    await this.auditService.log('LOGIN', user._id.toString(), user.email, 'unknown');

    return this.generateTokens(user);
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.userModel.findById(userId).select('+refreshToken');
    if (!user || !user.refreshToken) throw new UnauthorizedException('Invalid refresh token');

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) throw new UnauthorizedException('Refresh token rotation failed - compromised?');

    return this.generateTokens(user);
  }

  async googleLogin(googleUser: any) {
    if (!googleUser) throw new UnauthorizedException('No user from google');

    let user = await this.userModel.findOne({ email: googleUser.email });

    if (!user) {
      // Auto-register new google users
      user = await this.userModel.create({
        email: googleUser.email,
        name: googleUser.name,
        password: Math.random().toString(36).slice(-12), // Dummy password
        isEmailVerified: true, // Google accounts are verified
      });
    }

    return this.generateTokens(user);
  }

  async verifyEmail(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('jwt.secret'),
      });
      await this.userModel.findByIdAndUpdate(payload.sub, { isEmailVerified: true });
      return { message: 'Email verified successfully' };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }
  }

  async logout(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { refreshToken: null });
  }

  async validateUser(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).lean() as any;
  }

  async getProfile(userId: string) {
    return this.userModel.findById(userId).select('-password').lean();
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new UnauthorizedException('User with this email not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store reset password OTP in Redis with 10-minute expiry (600 seconds)
    await this.redisClient.set(`forgot_password_otp:${email}`, otp, 'EX', 600);

    try {
      await this.mailService.sendForgotPasswordOtp(user.email, otp);
    } catch (emailError: any) {
      console.warn(`Failed to send password reset OTP to ${user.email}. SMTP Error:`, emailError.message);
    }

    return { message: 'Password reset OTP sent to your email.' };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new UnauthorizedException('User not found');

    const key = `forgot_password_otp:${email}`;
    const savedOtp = await this.redisClient.get(key);

    if (!savedOtp) {
      throw new UnauthorizedException('OTP has expired or is invalid. Please request a new one.');
    }

    if (savedOtp !== otp) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    user.password = hashed;
    await user.save();

    // Clear from Redis
    await this.redisClient.del(key);

    return { message: 'Password reset successful. You can now log in.' };
  }

  private async generateTokens(user: UserDocument) {
    const payload = { sub: user._id.toString(), email: user.email, role: user.role };
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: '15m', // Short-lived access token
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret') || 'refresh-secret',
        expiresIn: '7d', // Long-lived refresh token
      }),
    ]);

    // Save hashed refresh token to DB
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.userModel.findByIdAndUpdate(user._id, { refreshToken: hashedRefresh });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }
}
