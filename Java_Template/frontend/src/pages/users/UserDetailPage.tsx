import { userApi } from '@/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ROUTES } from '@/constants';
import { useNotification } from '@/contexts/NotificationContext';
import { useApiError } from '@/hooks/useApiError';
import { format, formatFullName } from '@/utils/format';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styles from './UserDetailPage.module.css';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success } = useNotification();
  const { handleError } = useApiError();
  const userId = Number(id);

  const { data: user, isLoading } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => userApi.getById(userId),
    enabled: Number.isFinite(userId),
  });

  const toggleStatus = useMutation({
    mutationFn: () =>
      user!.status === 'ACTIVE' ? userApi.deactivate(userId) : userApi.activate(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      success('User status updated');
    },
    onError: (err) => handleError(err),
  });

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <p>User not found.</p>
        <Link to={ROUTES.USERS}>Back to users</Link>
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <Link to={ROUTES.USERS} className={styles.back}>
            <ArrowLeft size={16} />
            Back to users
          </Link>
          <h1 className="page-title">{formatFullName(user.firstName, user.lastName)}</h1>
          <p className="page-description">{user.email}</p>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant={user.status === 'ACTIVE' ? 'danger' : 'secondary'}
            loading={toggleStatus.isPending}
            onClick={() => toggleStatus.mutate()}
          >
            {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>User details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className={styles.dl}>
            <div>
              <dt>Username</dt>
              <dd>{user.username}</dd>
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
              <dt>Created</dt>
              <dd>{format(user.createdAt)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{format(user.updatedAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => void navigate(ROUTES.USERS)}>
          Back to list
        </Button>
      </div>
    </div>
  );
}
