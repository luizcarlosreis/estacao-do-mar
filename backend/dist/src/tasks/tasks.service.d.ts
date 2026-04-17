import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class TasksService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createTaskDto: CreateTaskDto): import("@prisma/client").Prisma.Prisma__TaskClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        performedAt: Date | null;
        status: import("@prisma/client").$Enums.TaskStatus;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        performedAt: Date | null;
        status: import("@prisma/client").$Enums.TaskStatus;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        performedAt: Date | null;
        status: import("@prisma/client").$Enums.TaskStatus;
    }>;
    update(id: string, updateTaskDto: UpdateTaskDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        performedAt: Date | null;
        status: import("@prisma/client").$Enums.TaskStatus;
    }>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__TaskClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        performedAt: Date | null;
        status: import("@prisma/client").$Enums.TaskStatus;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
