import { userApi } from '@/api';
import type { User } from '@/api/types';
import { DataTable, type Column } from '@/components/table/DataTable';
import { Pagination } from '@/components/table/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useNotification } from '@/contexts/NotificationContext';
import { useApiError } from '@/hooks/useApiError';
import { usePagination } from '@/hooks/usePagination';
import { format, formatFullName, formatRole, formatStatus } from '@/utils/format';
import { updateRoleSchema, type UpdateRoleFormData } from '@/utils/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import styles from './UsersPage.module.css';

const roleOptions = [
  { value: '', label: 'All roles' },
  { value: 'USER', label: 'User' },
  { value: 'MODERATOR', label: 'Moderator' },
  { value: 'ADMIN', label: 'Admin' },
];

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'PENDING', label: 'Pending' },
];

function statusVariant(status: User['status']) {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'SUSPENDED':
      return 'error';
    default:
      return 'default';
  }
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const { success } = useNotification();
  const { handleError } = useApiError();
  const { page, size, sortBy, sortDir, setPage, toggleSort, reset } = usePagination();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, size, sortBy, sortDir, search, roleFilter, statusFilter],
    queryFn: () =>
      userApi.getAll({
        page,
        size,
        sortBy,
        sortDir,
        search: search || undefined,
        role: (roleFilter || undefined) as User['role'] | undefined,
        status: (statusFilter || undefined) as User['status'] | undefined,
      }),
  });

  const roleForm = useForm<UpdateRoleFormData>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: { role: 'USER' },
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: UpdateRoleFormData['role'] }) =>
      userApi.updateRole(id, { role }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      setRoleModalOpen(false);
      setSelectedUser(null);
      success('Role updated successfully');
    },
    onError: (err) => handleError(err),
  });

  const toggleStatus = useMutation({
    mutationFn: (user: User) =>
      user.status === 'ACTIVE' ? userApi.deactivate(user.id) : userApi.activate(user.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      success('User status updated');
    },
    onError: (err) => handleError(err),
  });

  const columns: Column<User>[] = [
    {
      key: 'firstName',
      header: 'Name',
      sortable: true,
      render: (user) => (
        <Link to={`/users/${user.id}`} className={styles.nameLink}>
          {formatFullName(user.firstName, user.lastName)}
        </Link>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (user) => user.email,
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (user) => <Badge variant="primary">{formatRole(user.role)}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (user) => (
        <Badge variant={statusVariant(user.status)}>{formatStatus(user.status)}</Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (user) => format(user.createdAt, 'date'),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedUser(user);
              roleForm.reset({ role: user.role });
              setRoleModalOpen(true);
            }}
          >
            Role
          </Button>
          <Button
            variant={user.status === 'ACTIVE' ? 'danger' : 'secondary'}
            size="sm"
            loading={toggleStatus.isPending}
            onClick={() => toggleStatus.mutate(user)}
          >
            {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  const applyFilters = () => {
    reset();
  };

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-description">Manage user accounts, roles, and status</p>
        </div>
      </header>

      <div className={styles.filters}>
        <Input
          label="Search by email"
          placeholder="Search..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            reset();
          }}
        />
        <Select
          label="Role"
          options={roleOptions}
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            reset();
          }}
        />
        <Select
          label="Status"
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            reset();
          }}
        />
        <div className={styles.filterAction}>
          <Button variant="secondary" onClick={applyFilters}>
            Apply
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.content ?? []}
        keyExtractor={(user) => user.id}
        loading={isLoading}
        emptyTitle="No users found"
        emptyDescription="Try adjusting your search or filters"
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={toggleSort}
      />

      {data?.meta ? <Pagination meta={data.meta} onPageChange={setPage} /> : null}

      <Modal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title="Change role"
        description={selectedUser ? `Update role for ${selectedUser.email}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={updateRole.isPending}
              onClick={roleForm.handleSubmit((formData) => {
                if (selectedUser) {
                  updateRole.mutate({ id: selectedUser.id, role: formData.role });
                }
              })}
            >
              Save
            </Button>
          </>
        }
      >
        <Select
          label="Role"
          options={[
            { value: 'USER', label: 'User' },
            { value: 'MODERATOR', label: 'Moderator' },
            { value: 'ADMIN', label: 'Admin' },
          ]}
          error={roleForm.formState.errors.role?.message}
          {...roleForm.register('role')}
        />
      </Modal>
    </div>
  );
}
