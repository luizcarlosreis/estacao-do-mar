export class CreateUserDto {
  cpf: string;
  name: string;
  email: string;
  password?: string; // Optional if we auto-generate it initially
}
