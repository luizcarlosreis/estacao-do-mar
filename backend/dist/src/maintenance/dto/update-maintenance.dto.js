"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMaintenanceDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_maintenance_dto_1 = require("./create-maintenance.dto");
class UpdateMaintenanceDto extends (0, mapped_types_1.PartialType)(create_maintenance_dto_1.CreateMaintenanceDto) {
}
exports.UpdateMaintenanceDto = UpdateMaintenanceDto;
//# sourceMappingURL=update-maintenance.dto.js.map