import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ParkingSpacesService } from './parking-spaces.service';
import { CreateParkingSpaceDto } from './dto/create-parking-space.dto';
import { UpdateParkingSpaceDto } from './dto/update-parking-space.dto';

@Controller('vagas')
export class ParkingSpacesController {
  constructor(private readonly parkingSpacesService: ParkingSpacesService) {}

  @Post()
  create(@Body() createParkingSpaceDto: CreateParkingSpaceDto) {
    return this.parkingSpacesService.create(createParkingSpaceDto);
  }

  @Get()
  findAll() {
    return this.parkingSpacesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.parkingSpacesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateParkingSpaceDto: UpdateParkingSpaceDto) {
    return this.parkingSpacesService.update(id, updateParkingSpaceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.parkingSpacesService.remove(id);
  }
}
