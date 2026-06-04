export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Resource {
  id: number;
  code: string;
  name: string;
  description: string;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'MAINTENANCE';
  department: Department;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: number;
  user: User;
  resource: Resource;
  transactionDate: string;
  returnDate?: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardSummary {
  totalUsers: number;
  totalResources: number;
  totalTransactions: number;
  transactionsByStatus: Record<string, number>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
}
