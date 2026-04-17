import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { cpf, name, email, password, unitId } = createUserDto;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ cpf }, { email }]
      }
    });

    if (existingUser) {
      throw new ConflictException('Usuário com este CPF ou E-mail já existe.');
    }

    const hashedPassword = await bcrypt.hash(password || cpf, 10);

    return this.prisma.user.create({
      data: {
        cpf,
        name,
        email,
        password: hashedPassword,
        role: 'MORADOR',
        unitId,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      include: {
        unit: true,
      }
    });
  }

  async findOne(cpf: string) {
    const user = await this.prisma.user.findUnique({
      where: { cpf },
      include: {
        unit: true,
        vehicles: true,
      }
    });

    if (!user) {
      throw new NotFoundException(`Morador com CPF ${cpf} não encontrado.`);
    }

    return user;
  }

  async update(cpf: string, updateUserDto: UpdateUserDto) {
    await this.findOne(cpf);

    const data = { ...updateUserDto };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { cpf },
      data,
    });
  }

  async remove(cpf: string) {
    await this.findOne(cpf);
    return this.prisma.user.delete({
      where: { cpf },
    });
  }
}
