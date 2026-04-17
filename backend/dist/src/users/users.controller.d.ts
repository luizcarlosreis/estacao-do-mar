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
        id: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        cpf: string;
        name: string;
        email: string;
        id: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
    }[]>;
    findOne(cpf: string): Promise<{
        cpf: string;
        name: string;
        email: string;
        id: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        units: {
            number: string;
            id: string;
            block: string;
            ownerId: string | null;
        }[];
        vehicles: {
            id: string;
            ownerId: string;
            plate: string;
            model: string;
            color: string;
        }[];
    }>;
    update(cpf: string, updateUserDto: UpdateUserDto): Promise<{
        cpf: string;
        name: string;
        email: string;
        id: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
    remove(cpf: string): Promise<{
        cpf: string;
        id: string;
    }>;
}
