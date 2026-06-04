import { axiosInstance } from './axios';
import { ApiResponse, AuthResponse, DashboardSummary, Department, Resource, Transaction, User } from '@/types';

// Auth Services
export const login = async (data: any): Promise<ApiResponse<AuthResponse>> => {
  const response = await axiosInstance.post('/auth/login', data);
  return response.data;
};

export const register = async (data: any): Promise<ApiResponse<AuthResponse>> => {
  const response = await axiosInstance.post('/auth/register', data);
  return response.data;
};

// User Services
export const getUsers = async (): Promise<ApiResponse<User[]>> => {
  const response = await axiosInstance.get('/users');
  return response.data;
};

// Department Services
export const getDepartments = async (): Promise<ApiResponse<Department[]>> => {
  const response = await axiosInstance.get('/departments');
  return response.data;
};

export const createDepartment = async (data: any): Promise<ApiResponse<Department>> => {
  const response = await axiosInstance.post('/departments', data);
  return response.data;
};

// Resource Services
export const getResources = async (): Promise<ApiResponse<Resource[]>> => {
  const response = await axiosInstance.get('/resources');
  return response.data;
};

export const createResource = async (data: any): Promise<ApiResponse<Resource>> => {
  const response = await axiosInstance.post('/resources', data);
  return response.data;
};

// Transaction Services
export const getTransactions = async (): Promise<ApiResponse<Transaction[]>> => {
  const response = await axiosInstance.get('/transactions');
  return response.data;
};

export const createTransaction = async (data: any): Promise<ApiResponse<Transaction>> => {
  const response = await axiosInstance.post('/transactions', data);
  return response.data;
};

export const updateTransactionStatus = async (id: number, status: string): Promise<ApiResponse<Transaction>> => {
  const response = await axiosInstance.patch(`/transactions/${id}/status`, null, {
    params: { status }
  });
  return response.data;
};

// Dashboard Services
export const getDashboardSummary = async (): Promise<ApiResponse<DashboardSummary>> => {
  const response = await axiosInstance.get('/dashboard');
  return response.data;
};
