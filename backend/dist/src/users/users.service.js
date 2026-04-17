"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createUserDto) {
        const { cpf, name, email, password } = createUserDto;
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ cpf }, { email }]
            }
        });
        if (existingUser) {
            throw new common_1.ConflictException('Usuário com este CPF ou E-mail já existe.');
        }
        const hashedPassword = await bcrypt.hash(password || cpf, 10);
        return this.prisma.user.create({
            data: {
                cpf,
                name,
                email,
                password: hashedPassword,
                role: 'MORADOR',
            },
        });
    }
    findAll() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                cpf: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            }
        });
    }
    async findOne(cpf) {
        const user = await this.prisma.user.findUnique({
            where: { cpf },
            select: {
                id: true,
                cpf: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                units: true,
                vehicles: true,
            }
        });
        if (!user) {
            throw new common_1.NotFoundException(`Morador com CPF ${cpf} não encontrado.`);
        }
        return user;
    }
    async update(cpf, updateUserDto) {
        await this.findOne(cpf);
        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        return this.prisma.user.update({
            where: { cpf },
            data: updateUserDto,
            select: {
                id: true,
                cpf: true,
                name: true,
                email: true,
                role: true,
            }
        });
    }
    async remove(cpf) {
        await this.findOne(cpf);
        return this.prisma.user.delete({
            where: { cpf },
            select: {
                id: true,
                cpf: true,
            }
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map