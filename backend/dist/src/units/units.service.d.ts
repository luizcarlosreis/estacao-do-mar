import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class UnitsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createUnitDto: CreateUnitDto): import("@prisma/client").Prisma.Prisma__UnitClient<{
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
    update(id: string, updateUnitDto: UpdateUnitDto): import("@prisma/client").Prisma.Prisma__UnitClient<{
        number: string;
        id: string;
        block: string;
        ownerId: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__UnitClient<{
        number: string;
        id: string;
        block: string;
        ownerId: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
