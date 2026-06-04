import { userApi } from '@/api';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants';
import { formatFullName, formatRole, formatStatus } from '@/utils/format';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { user, isAdmin } = useAuth();

  const { data: usersPage } = useQuery({
    queryKey: ['users', 'stats'],
    queryFn: () => userApi.getAll({ page: 0, size: 1 }),
    enabled: isAdmin,
  });

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">
            Welcome back{user ? `, ${user.firstName}` : ''}. Here&apos;s an overview of your account.
          </p>
        </div>
      </header>

      <div className={styles.stats}>
        <Card>
          <CardHeader>
            <CardTitle>Your account</CardTitle>
            <CardDescription>Current profile summary</CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <dl className={styles.dl}>
                <div>
                  <dt>Name</dt>
                  <dd>{formatFullName(user.firstName, user.lastName)}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{user.email}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>
                    <Badge variant="primary">{formatRole(user.role)}</Badge>
                  </dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <Badge
                      variant={
                        user.status === 'ACTIVE'
                          ? 'success'
                          : user.status === 'PENDING'
                            ? 'warning'
                            : 'default'
                      }
                    >
                      {formatStatus(user.status)}
                    </Badge>
                  </dd>
                </div>
              </dl>
            ) : null}
          </CardContent>
        </Card>

        {isAdmin && usersPage ? (
          <Card>
            <CardHeader>
              <CardTitle>Platform</CardTitle>
              <CardDescription>Admin overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.metric}>
                <Users size={20} />
                <div>
                  <span className={styles.metricValue}>{usersPage.meta.totalElements}</span>
                  <span className={styles.metricLabel}>Total users</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className={styles.quickLinks}>
        <h2 className={styles.sectionTitle}>Quick links</h2>
        <div className={styles.links}>
          <Link to={ROUTES.PROFILE} className={styles.linkCard}>
            <LayoutDashboard size={20} />
            <span>Manage profile</span>
          </Link>
          {isAdmin ? (
            <>
              <Link to={ROUTES.USERS} className={styles.linkCard}>
                <Users size={20} />
                <span>User management</span>
              </Link>
              <Link to={ROUTES.ROLES} className={styles.linkCard}>
                <Shield size={20} />
                <span>Role management</span>
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
