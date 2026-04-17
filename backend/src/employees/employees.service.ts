import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    const { password, cpf, email, ...rest } = createEmployeeDto;

    const existing = await this.prisma.employee.findFirst({
      where: { OR: [{ cpf }, email ? { email } : {}].filter(o => Object.keys(o).length > 0) }
    });

    if (existing) {
      throw new ConflictException('Colaborador com este CPF ou E-mail já existe.');
    }

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    return this.prisma.employee.create({
      data: {
        ...rest,
        cpf,
        email,
        password: hashedPassword,
      },
    });
  }

  findAll() {
    return this.prisma.employee.findMany();
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });
    if (!employee) {
      throw new NotFoundException(`Colaborador ${id} não encontrado.`);
    }
    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    const { password, ...rest } = updateEmployeeDto;
    
    const data: any = { ...rest };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    return this.prisma.employee.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.employee.delete({
      where: { id },
    });
  }
}
