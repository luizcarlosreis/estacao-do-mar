export class CreateEmployeeDto {
  name: string;
  cpf: string;
  email?: string;
  password?: string;
  phone?: string;
  role: 'PORTEIRO' | 'ZELADOR' | 'LIMPEZA' | 'MANUTENCAO';
  shift?: string;
}
