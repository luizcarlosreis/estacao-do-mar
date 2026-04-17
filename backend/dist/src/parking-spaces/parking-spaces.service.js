"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParkingSpacesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ParkingSpacesService = class ParkingSpacesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(createParkingSpaceDto) {
        return this.prisma.parkingSpace.create({
            data: createParkingSpaceDto,
        });
    }
    findAll() {
        return this.prisma.parkingSpace.findMany({
            include: {
                unit: {
                    select: {
                        number: true,
                        block: true,
                    }
                }
            }
        });
    }
    async findOne(id) {
        const space = await this.prisma.parkingSpace.findUnique({
            where: { id },
            include: {
                unit: true
            }
        });
        if (!space) {
            throw new common_1.NotFoundException(`Vaga ${id} não encontrada.`);
        }
        return space;
    }
    update(id, updateParkingSpaceDto) {
        return this.prisma.parkingSpace.update({
            where: { id },
            data: updateParkingSpaceDto,
        });
    }
    remove(id) {
        return this.prisma.parkingSpace.delete({
            where: { id },
        });
    }
};
exports.ParkingSpacesService = ParkingSpacesService;
exports.ParkingSpacesService = ParkingSpacesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ParkingSpacesService);
//# sourceMappingURL=parking-spaces.service.js.map