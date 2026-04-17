import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  create(createUnitDto: CreateUnitDto) {
    return this.prisma.unit.create({
      data: createUnitDto,
    });
  }

  findAll() {
    return this.prisma.unit.findMany({
      include: {
        owner: {
          select: {
            name: true,
            cpf: true,
          }
        }
      }
    });
  }

  async findOne(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            name: true,
            cpf: true,
          }
        }
      }
    });
    if (!unit) {
      throw new NotFoundException(`Unidade ${id} não encontrada.`);
    }
    return unit;
  }

  update(id: string, updateUnitDto: UpdateUnitDto) {
    return this.prisma.unit.update({
      where: { id },
      data: updateUnitDto,
    });
  }

  remove(id: string) {
    return this.prisma.unit.delete({
      where: { id },
    });
  }
}
