import { userApi } from '@/api';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useQuery } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import styles from './RolesPage.module.css';

const roles = [
  {
    name: 'USER',
    description: 'Default role assigned on registration. Can access own profile and dashboard.',
    permissions: ['View own profile', 'Update own profile', 'Change own password'],
  },
  {
    name: 'MODERATOR',
    description:
      'Defined in the schema but not yet used by backend endpoints. Reserved for future moderation features.',
    permissions: ['Same as USER (currently)'],
  },
  {
    name: 'ADMIN',
    description: 'Full user management access. Can list, view, change roles, and manage account status.',
    permissions: [
      'List all users',
      'View any user',
      'Change user roles',
      'Activate / deactivate accounts',
    ],
  },
];

export function RolesPage() {
  const { data: usersPage } = useQuery({
    queryKey: ['users', 'role-stats'],
    queryFn: () => userApi.getAll({ page: 0, size: 100 }),
  });

  const roleCounts = roles.reduce<Record<string, number>>((acc, role) => {
    acc[role.name] =
      usersPage?.content.filter((user) => user.role === role.name).length ?? 0;
    return acc;
  }, {});

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Roles & Permissions</h1>
          <p className="page-description">
            Overview of available roles and their access levels in the system
          </p>
        </div>
      </header>

      <div className={styles.grid}>
        {roles.map((role) => (
          <Card key={role.name}>
            <CardHeader>
              <div className={styles.roleHeader}>
                <Shield size={20} />
                <div>
                  <CardTitle>{role.name}</CardTitle>
                  <CardDescription>
                    {roleCounts[role.name] ?? 0} user{(roleCounts[role.name] ?? 0) !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className={styles.description}>{role.description}</p>
              <h4 className={styles.permTitle}>Permissions</h4>
              <ul className={styles.permissions}>
                {role.permissions.map((perm) => (
                  <li key={perm}>
                    <Badge variant="default">{perm}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
