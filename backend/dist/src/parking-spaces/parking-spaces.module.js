"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParkingSpacesModule = void 0;
const common_1 = require("@nestjs/common");
const parking_spaces_service_1 = require("./parking-spaces.service");
const parking_spaces_controller_1 = require("./parking-spaces.controller");
let ParkingSpacesModule = class ParkingSpacesModule {
};
exports.ParkingSpacesModule = ParkingSpacesModule;
exports.ParkingSpacesModule = ParkingSpacesModule = __decorate([
    (0, common_1.Module)({
        controllers: [parking_spaces_controller_1.ParkingSpacesController],
        providers: [parking_spaces_service_1.ParkingSpacesService],
    })
], ParkingSpacesModule);
//# sourceMappingURL=parking-spaces.module.js.map