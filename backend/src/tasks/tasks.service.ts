import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  create(createTaskDto: CreateTaskDto) {
    const { performedAt, ...rest } = createTaskDto;
    return this.prisma.task.create({
      data: {
        ...rest,
        performedAt: performedAt ? new Date(performedAt) : null,
      },
    });
  }

  findAll() {
    return this.prisma.task.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });
    if (!task) {
      throw new NotFoundException(`Tarefa ${id} não encontrada.`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    const { performedAt, ...rest } = updateTaskDto;
    
    const data: any = { ...rest };
    if (performedAt) {
      data.performedAt = new Date(performedAt);
    } else if (updateTaskDto.status === 'DONE' && !performedAt) {
      // Se mudar para DONE e não informar data, usa agora
      const current = await this.findOne(id);
      if (!current.performedAt) data.performedAt = new Date();
    }

    return this.prisma.task.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.task.delete({
      where: { id },
    });
  }
}
