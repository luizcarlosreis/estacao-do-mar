export class CreateMaintenanceDto {
  title: string;
  description?: string;
  performedAt: string; // ISO String
  nextMaintenanceAt: string; // ISO String
}
