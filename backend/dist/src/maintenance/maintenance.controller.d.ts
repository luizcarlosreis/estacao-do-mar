import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
export declare class MaintenanceController {
    private readonly maintenanceService;
    constructor(maintenanceService: MaintenanceService);
    create(createMaintenanceDto: CreateMaintenanceDto): import("@prisma/client").Prisma.Prisma__MaintenanceClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        performedAt: Date;
        nextMaintenanceAt: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findAll(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        performedAt: Date;
        nextMaintenanceAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        performedAt: Date;
        nextMaintenanceAt: Date;
    }>;
    update(id: string, updateMaintenanceDto: UpdateMaintenanceDto): import("@prisma/client").Prisma.Prisma__MaintenanceClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        performedAt: Date;
        nextMaintenanceAt: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__MaintenanceClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        performedAt: Date;
        nextMaintenanceAt: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
