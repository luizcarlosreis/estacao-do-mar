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
exports.ParkingSpacesController = void 0;
const common_1 = require("@nestjs/common");
const parking_spaces_service_1 = require("./parking-spaces.service");
const create_parking_space_dto_1 = require("./dto/create-parking-space.dto");
const update_parking_space_dto_1 = require("./dto/update-parking-space.dto");
let ParkingSpacesController = class ParkingSpacesController {
    parkingSpacesService;
    constructor(parkingSpacesService) {
        this.parkingSpacesService = parkingSpacesService;
    }
    create(createParkingSpaceDto) {
        return this.parkingSpacesService.create(createParkingSpaceDto);
    }
    findAll() {
        return this.parkingSpacesService.findAll();
    }
    findOne(id) {
        return this.parkingSpacesService.findOne(id);
    }
    update(id, updateParkingSpaceDto) {
        return this.parkingSpacesService.update(id, updateParkingSpaceDto);
    }
    remove(id) {
        return this.parkingSpacesService.remove(id);
    }
};
exports.ParkingSpacesController = ParkingSpacesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_parking_space_dto_1.CreateParkingSpaceDto]),
    __metadata("design:returntype", void 0)
], ParkingSpacesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ParkingSpacesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ParkingSpacesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_parking_space_dto_1.UpdateParkingSpaceDto]),
    __metadata("design:returntype", void 0)
], ParkingSpacesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ParkingSpacesController.prototype, "remove", null);
exports.ParkingSpacesController = ParkingSpacesController = __decorate([
    (0, common_1.Controller)('vagas'),
    __metadata("design:paramtypes", [parking_spaces_service_1.ParkingSpacesService])
], ParkingSpacesController);
//# sourceMappingURL=parking-spaces.controller.js.map