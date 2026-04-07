// Usuario
export interface User {
  id?: string | number;
  username: string;
  nombre?: string;
  email?: string;
  rol?: 'administrador' | 'almacenista' | 'profesor' | 'estudiante';
  token?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
