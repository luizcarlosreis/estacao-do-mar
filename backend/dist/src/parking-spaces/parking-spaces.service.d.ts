import { CreateParkingSpaceDto } from './dto/create-parking-space.dto';
import { UpdateParkingSpaceDto } from './dto/update-parking-space.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class ParkingSpacesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createParkingSpaceDto: CreateParkingSpaceDto): import("@prisma/client").Prisma.Prisma__ParkingSpaceClient<{
        number: string;
        id: string;
        block: string;
        ownerId: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        owner: {
            cpf: string;
            name: string;
        } | null;
    } & {
        number: string;
        id: string;
        block: string;
        ownerId: string | null;
    })[]>;
    findOne(id: string): Promise<{
        owner: {
            cpf: string;
            name: string;
        } | null;
    } & {
        number: string;
        id: string;
        block: string;
        ownerId: string | null;
    }>;
    update(id: string, updateParkingSpaceDto: UpdateParkingSpaceDto): import("@prisma/client").Prisma.Prisma__ParkingSpaceClient<{
        number: string;
        id: string;
        block: string;
        ownerId: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__ParkingSpaceClient<{
        number: string;
        id: string;
        block: string;
        ownerId: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
