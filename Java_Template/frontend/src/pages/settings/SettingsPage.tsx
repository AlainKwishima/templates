import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { APP_NAME } from '@/constants';
import { useTheme } from '@/contexts/ThemeContext';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-description">Application preferences and configuration</p>
        </div>
      </header>

      <div className={styles.grid}>
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how the application looks</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              label="Theme"
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application</CardTitle>
            <CardDescription>General application information</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className={styles.dl}>
              <div>
                <dt>App name</dt>
                <dd>{APP_NAME}</dd>
              </div>
              <div>
                <dt>API version</dt>
                <dd>v1</dd>
              </div>
              <div>
                <dt>Environment</dt>
                <dd>{import.meta.env.MODE}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Notification preferences (client-side)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={styles.note}>
              Backend settings API is not yet implemented. Notification toasts are enabled by
              default for API responses and user actions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
