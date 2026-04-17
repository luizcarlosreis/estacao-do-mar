"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateParkingSpaceDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_parking_space_dto_1 = require("./create-parking-space.dto");
class UpdateParkingSpaceDto extends (0, mapped_types_1.PartialType)(create_parking_space_dto_1.CreateParkingSpaceDto) {
}
exports.UpdateParkingSpaceDto = UpdateParkingSpaceDto;
//# sourceMappingURL=update-parking-space.dto.js.map