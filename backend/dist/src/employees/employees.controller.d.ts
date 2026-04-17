import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
export declare class EmployeesController {
    private readonly employeesService;
    constructor(employeesService: EmployeesService);
    create(createEmployeeDto: CreateEmployeeDto): Promise<{
        cpf: string;
        name: string;
        email: string | null;
        password: string | null;
        id: string;
        role: import("@prisma/client").$Enums.EmployeeRole;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        shift: string | null;
    }>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        cpf: string;
        name: string;
        email: string | null;
        password: string | null;
        id: string;
        role: import("@prisma/client").$Enums.EmployeeRole;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        shift: string | null;
    }[]>;
    findOne(id: string): Promise<{
        cpf: string;
        name: string;
        email: string | null;
        password: string | null;
        id: string;
        role: import("@prisma/client").$Enums.EmployeeRole;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        shift: string | null;
    }>;
    update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<{
        cpf: string;
        name: string;
        email: string | null;
        password: string | null;
        id: string;
        role: import("@prisma/client").$Enums.EmployeeRole;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        shift: string | null;
    }>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__EmployeeClient<{
        cpf: string;
        name: string;
        email: string | null;
        password: string | null;
        id: string;
        role: import("@prisma/client").$Enums.EmployeeRole;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        shift: string | null;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
