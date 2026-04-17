import { Module } from '@nestjs/common';
import { ParkingSpacesService } from './parking-spaces.service';
import { ParkingSpacesController } from './parking-spaces.controller';

@Module({
  controllers: [ParkingSpacesController],
  providers: [ParkingSpacesService],
})
export class ParkingSpacesModule {}
