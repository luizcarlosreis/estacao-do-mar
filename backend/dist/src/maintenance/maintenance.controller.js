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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceController = void 0;
const common_1 = require("@nestjs/common");
const maintenance_service_1 = require("./maintenance.service");
const create_maintenance_dto_1 = require("./dto/create-maintenance.dto");
const update_maintenance_dto_1 = require("./dto/update-maintenance.dto");
let MaintenanceController = class MaintenanceController {
    maintenanceService;
    constructor(maintenanceService) {
        this.maintenanceService = maintenanceService;
    }
    create(createMaintenanceDto) {
        return this.maintenanceService.create(createMaintenanceDto);
    }
    findAll() {
        return this.maintenanceService.findAll();
    }
    findOne(id) {
        return this.maintenanceService.findOne(id);
    }
    update(id, updateMaintenanceDto) {
        return this.maintenanceService.update(id, updateMaintenanceDto);
    }
    remove(id) {
        return this.maintenanceService.remove(id);
    }
};
exports.MaintenanceController = MaintenanceController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_maintenance_dto_1.CreateMaintenanceDto]),
    __metadata("design:returntype", void 0)
], MaintenanceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MaintenanceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MaintenanceController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_maintenance_dto_1.UpdateMaintenanceDto]),
    __metadata("design:returntype", void 0)
], MaintenanceController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MaintenanceController.prototype, "remove", null);
exports.MaintenanceController = MaintenanceController = __decorate([
    (0, common_1.Controller)('manutencoes'),
    __metadata("design:paramtypes", [maintenance_service_1.MaintenanceService])
], MaintenanceController);
//# sourceMappingURL=maintenance.controller.js.map