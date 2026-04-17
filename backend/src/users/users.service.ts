import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { cpf, name, email, password } = createUserDto;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ cpf }, { email }]
      }
    });

    if (existingUser) {
      throw new ConflictException('Usuário com este CPF ou E-mail já existe.');
    }

    // Default password as CPF if not provided, for demo purposes
    const hashedPassword = await bcrypt.hash(password || cpf, 10);

    return this.prisma.user.create({
      data: {
        cpf,
        name,
        email,
        password: hashedPassword,
        role: 'MORADOR',
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        cpf: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });
  }

  async findOne(cpf: string) {
    const user = await this.prisma.user.findUnique({
      where: { cpf },
      select: {
        id: true,
        cpf: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        units: true,
        vehicles: true,
      }
    });

    if (!user) {
      throw new NotFoundException(`Morador com CPF ${cpf} não encontrado.`);
    }

    return user;
  }

  async update(cpf: string, updateUserDto: UpdateUserDto) {
    // Check if exists first
    await this.findOne(cpf);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { cpf },
      data: updateUserDto,
      select: {
        id: true,
        cpf: true,
        name: true,
        email: true,
        role: true,
      }
    });
  }

  async remove(cpf: string) {
    // Check if exists
    await this.findOne(cpf);

    return this.prisma.user.delete({
      where: { cpf },
      select: {
        id: true,
        cpf: true,
      }
    });
  }
}
