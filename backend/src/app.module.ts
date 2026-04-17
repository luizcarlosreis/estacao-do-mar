import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ParkingSpacesModule } from './parking-spaces/parking-spaces.module';
import { UnitsModule } from './units/units.module';
import { EmployeesModule } from './employees/employees.module';

@Module({
  imports: [PrismaModule, UsersModule, ParkingSpacesModule, UnitsModule, EmployeesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
