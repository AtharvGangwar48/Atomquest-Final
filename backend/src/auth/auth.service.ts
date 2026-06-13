import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, name: string, role: 'agent' | 'customer', employeeId?: string) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new Error('Email already exists');
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ 
      email, 
      password: hashedPassword, 
      name, 
      role, 
      employeeId: role === 'agent' ? employeeId : undefined,
      isVerified: false, 
      isActive: true 
    });
    await this.userRepo.save(user);
    return this.generateToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Your account has been removed. Contact admin.');
    }
    return this.generateToken(user);
  }

  private generateToken(user: User) {
    const payload = { sub: user.id, email: user.email, name: user.name, role: user.role, isVerified: user.isVerified };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role, isVerified: user.isVerified },
    };
  }

  async validateUser(userId: string) {
    return this.userRepo.findOne({ where: { id: userId, isActive: true } });
  }
}
