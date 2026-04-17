import { TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  performedAt?: string; // ISO String
}
