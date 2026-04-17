export class CreateParkingSpaceDto {
  number: string;
  block: string;
  ownerId?: string; // UUID of the User/Morador
}
