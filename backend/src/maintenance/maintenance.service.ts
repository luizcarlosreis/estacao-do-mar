import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  create(createMaintenanceDto: CreateMaintenanceDto) {
    const { performedAt, nextMaintenanceAt, ...rest } = createMaintenanceDto;
    return this.prisma.maintenance.create({
      data: {
        ...rest,
        performedAt: new Date(performedAt),
        nextMaintenanceAt: new Date(nextMaintenanceAt),
      },
    });
  }

  findAll() {
    return this.prisma.maintenance.findMany({
      orderBy: { performedAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const maintenance = await this.prisma.maintenance.findUnique({
      where: { id },
    });
    if (!maintenance) {
      throw new NotFoundException(`Manutenção ${id} não encontrada.`);
    }
    return maintenance;
  }

  update(id: string, updateMaintenanceDto: UpdateMaintenanceDto) {
    const { performedAt, nextMaintenanceAt, ...rest } = updateMaintenanceDto;
    
    const data: any = { ...rest };
    if (performedAt) data.performedAt = new Date(performedAt);
    if (nextMaintenanceAt) data.nextMaintenanceAt = new Date(nextMaintenanceAt);

    return this.prisma.maintenance.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.maintenance.delete({
      where: { id },
    });
  }
}
