import { userApi } from '@/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PASSWORD_HINT } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useApiError } from '@/hooks/useApiError';
import { format } from '@/utils/format';
import {
  updatePasswordSchema,
  updateProfileSchema,
  type UpdatePasswordFormData,
  type UpdateProfileFormData,
} from '@/utils/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { success } = useNotification();
  const { handleError } = useApiError();

  const profileForm = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { firstName: '', lastName: '', username: '' },
  });

  const passwordForm = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
      });
    }
  }, [user, profileForm]);

  const updateProfile = useMutation({
    mutationFn: (data: UpdateProfileFormData) => userApi.updateMe(data),
    onSuccess: async () => {
      await refreshProfile();
      success('Profile updated successfully');
    },
    onError: (err) => handleError(err),
  });

  const updatePassword = useMutation({
    mutationFn: (data: UpdatePasswordFormData) =>
      userApi.updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      passwordForm.reset();
      success('Password changed successfully');
    },
    onError: (err) => handleError(err),
  });

  if (!user) return null;

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-description">Manage your personal information and security settings</p>
        </div>
      </header>

      <div className={styles.grid}>
        <Card>
          <CardHeader>
            <CardTitle>Account info</CardTitle>
            <CardDescription>Read-only account details</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className={styles.dl}>
              <div>
                <dt>Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>
                  <Badge variant="primary">{user.role}</Badge>
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <Badge variant={user.status === 'ACTIVE' ? 'success' : 'warning'}>
                    {user.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt>Member since</dt>
                <dd>{format(user.createdAt, 'date')}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit profile</CardTitle>
            <CardDescription>Update your name and username</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className={styles.form}
              onSubmit={profileForm.handleSubmit((data) => updateProfile.mutate(data))}
              noValidate
            >
              <div className={styles.row}>
                <Input
                  label="First name"
                  error={profileForm.formState.errors.firstName?.message}
                  {...profileForm.register('firstName')}
                />
                <Input
                  label="Last name"
                  error={profileForm.formState.errors.lastName?.message}
                  {...profileForm.register('lastName')}
                />
              </div>
              <Input
                label="Username"
                error={profileForm.formState.errors.username?.message}
                {...profileForm.register('username')}
              />
              <Button type="submit" loading={updateProfile.isPending}>
                Save changes
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className={styles.form}
              onSubmit={passwordForm.handleSubmit((data) => updatePassword.mutate(data))}
              noValidate
            >
              <Input
                label="Current password"
                type="password"
                autoComplete="current-password"
                error={passwordForm.formState.errors.currentPassword?.message}
                {...passwordForm.register('currentPassword')}
              />
              <Input
                label="New password"
                type="password"
                autoComplete="new-password"
                hint={PASSWORD_HINT}
                error={passwordForm.formState.errors.newPassword?.message}
                {...passwordForm.register('newPassword')}
              />
              <Input
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                error={passwordForm.formState.errors.confirmPassword?.message}
                {...passwordForm.register('confirmPassword')}
              />
              <Button type="submit" loading={updatePassword.isPending}>
                Update password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
