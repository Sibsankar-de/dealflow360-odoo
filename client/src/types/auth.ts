export type PlatformRole = "User" | "Company Admin" | "Sales Representative" | "Sales Manager" | "Finance Manager";

export interface UserResponseType {
  id: string;
  userName: string;
  email: string;
  avatar: string | null;
  authBy: string;
  isEmailVerified: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  statusCode: number;
  data: T;
  message: string;
  success?: boolean;
}

export interface AuthData {
  user: UserResponseType;
}

export interface RegisterUserRequest {
  userName: string;
  email: string;
  password: string;
}

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  userName?: string;
  avatar?: string | null;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthContextType {
  user: UserResponseType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginUserRequest) => Promise<UserResponseType>;
  register: (data: RegisterUserRequest) => Promise<UserResponseType>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateUserRequest) => Promise<UserResponseType>;
  updatePassword: (data: UpdatePasswordRequest) => Promise<void>;
  refetchUser: () => void;
}
