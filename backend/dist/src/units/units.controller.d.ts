import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
export declare class UnitsController {
    private readonly unitsService;
    constructor(unitsService: UnitsService);
    create(createUnitDto: CreateUnitDto): import("@prisma/client").Prisma.Prisma__UnitClient<{
        number: string;
        id: string;
        block: string;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        residents: {
            cpf: string;
            name: string;
        }[];
        parkingSpaces: {
            number: string;
            block: string;
        }[];
    } & {
        number: string;
        id: string;
        block: string;
    })[]>;
    findOne(id: string): Promise<{
        residents: {
            cpf: string;
            name: string;
            email: string;
            password: string;
            unitId: string | null;
            id: string;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        }[];
        parkingSpaces: {
            number: string;
            unitId: string | null;
            id: string;
            block: string;
        }[];
    } & {
        number: string;
        id: string;
        block: string;
    }>;
    update(id: string, updateUnitDto: UpdateUnitDto): import("@prisma/client").Prisma.Prisma__UnitClient<{
        number: string;
        id: string;
        block: string;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__UnitClient<{
        number: string;
        id: string;
        block: string;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
