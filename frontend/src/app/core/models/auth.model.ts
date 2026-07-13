export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'RESEARCHER' | 'CHECKER';
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: 'RESEARCHER' | 'CHECKER' | 'ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  bio?: string;
  affiliation?: string;
  expertise?: string[];
  createdAt: string;
}