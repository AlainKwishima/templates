import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { register as registerService } from '@/api/services';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterForm = z.infer<typeof registerSchema>;

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError('');
      // By default, register them as 'USER' role for starter kit
      const payload = { ...data, roleName: 'USER' };
      const res = await registerService(payload);
      if (res.success) {
        login(res.data.token, res.data.user);
        navigate('/dashboard');
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          id="firstName"
          {...register('firstName')}
          error={errors.firstName?.message}
        />
        <Input
          label="Last Name"
          id="lastName"
          {...register('lastName')}
          error={errors.lastName?.message}
        />
      </div>

      <Input
        label="Email address"
        id="email"
        type="email"
        autoComplete="email"
        {...register('email')}
        error={errors.email?.message}
      />

      <Input
        label="Password"
        id="password"
        type="password"
        autoComplete="new-password"
        {...register('password')}
        error={errors.password?.message}
      />

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Create Account
      </Button>

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
};

export default Register;
