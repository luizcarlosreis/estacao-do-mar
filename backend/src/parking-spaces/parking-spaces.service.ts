import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateParkingSpaceDto } from './dto/create-parking-space.dto';
import { UpdateParkingSpaceDto } from './dto/update-parking-space.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParkingSpacesService {
  constructor(private prisma: PrismaService) {}

  create(createParkingSpaceDto: CreateParkingSpaceDto) {
    return this.prisma.parkingSpace.create({
      data: createParkingSpaceDto,
    });
  }

  findAll() {
    return this.prisma.parkingSpace.findMany({
      include: {
        unit: {
          select: {
            number: true,
            block: true,
          }
        }
      }
    });
  }

  async findOne(id: string) {
    const space = await this.prisma.parkingSpace.findUnique({
      where: { id },
      include: {
        unit: true
      }
    });
    if (!space) {
      throw new NotFoundException(`Vaga ${id} não encontrada.`);
    }
    return space;
  }

  update(id: string, updateParkingSpaceDto: UpdateParkingSpaceDto) {
    return this.prisma.parkingSpace.update({
      where: { id },
      data: updateParkingSpaceDto,
    });
  }

  remove(id: string) {
    return this.prisma.parkingSpace.delete({
      where: { id },
    });
  }
}
