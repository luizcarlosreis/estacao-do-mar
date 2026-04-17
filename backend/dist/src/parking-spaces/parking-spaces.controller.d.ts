import { ParkingSpacesService } from './parking-spaces.service';
import { CreateParkingSpaceDto } from './dto/create-parking-space.dto';
import { UpdateParkingSpaceDto } from './dto/update-parking-space.dto';
export declare class ParkingSpacesController {
    private readonly parkingSpacesService;
    constructor(parkingSpacesService: ParkingSpacesService);
    create(createParkingSpaceDto: CreateParkingSpaceDto): import("@prisma/client").Prisma.Prisma__ParkingSpaceClient<{
        number: string;
        unitId: string | null;
        id: string;
        block: string;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        unit: {
            number: string;
            block: string;
        } | null;
    } & {
        number: string;
        unitId: string | null;
        id: string;
        block: string;
    })[]>;
    findOne(id: string): Promise<{
        unit: {
            number: string;
            id: string;
            block: string;
        } | null;
    } & {
        number: string;
        unitId: string | null;
        id: string;
        block: string;
    }>;
    update(id: string, updateParkingSpaceDto: UpdateParkingSpaceDto): import("@prisma/client").Prisma.Prisma__ParkingSpaceClient<{
        number: string;
        unitId: string | null;
        id: string;
        block: string;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__ParkingSpaceClient<{
        number: string;
        unitId: string | null;
        id: string;
        block: string;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
