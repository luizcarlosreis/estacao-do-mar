import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<{
        cpf: string;
        name: string;
        email: string;
        password: string;
        unitId: string | null;
        id: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<({
        unit: {
            number: string;
            id: string;
            block: string;
        } | null;
    } & {
        cpf: string;
        name: string;
        email: string;
        password: string;
        unitId: string | null;
        id: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(cpf: string): Promise<{
        unit: {
            number: string;
            id: string;
            block: string;
        } | null;
        vehicles: {
            id: string;
            plate: string;
            model: string;
            color: string;
            ownerId: string;
        }[];
    } & {
        cpf: string;
        name: string;
        email: string;
        password: string;
        unitId: string | null;
        id: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(cpf: string, updateUserDto: UpdateUserDto): Promise<{
        cpf: string;
        name: string;
        email: string;
        password: string;
        unitId: string | null;
        id: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(cpf: string): Promise<{
        cpf: string;
        name: string;
        email: string;
        password: string;
        unitId: string | null;
        id: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
