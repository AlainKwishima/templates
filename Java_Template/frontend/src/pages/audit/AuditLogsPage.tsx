import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ClipboardList } from 'lucide-react';

export function AuditLogsPage() {
  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-description">Activity and change history for the platform</p>
        </div>
      </header>

      <Card padding="none">
        <CardHeader style={{ padding: 'var(--space-5)' }}>
          <CardTitle>Activity log</CardTitle>
          <CardDescription>
            The backend uses JPA auditing ({`createdBy`}, {`updatedBy`}, timestamps) but does not
            yet expose a read API for audit logs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<ClipboardList size={40} />}
            title="Audit log API not available"
            description="This page is ready for integration when you add an audit log endpoint to the backend. Entity-level audit fields are already tracked on BaseEntity."
          />
        </CardContent>
      </Card>
    </div>
  );
}
