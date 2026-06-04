import { APP_NAME, ROUTES } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { formatFullName, formatInitials } from '@/utils/format';
import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Shield,
  Sun,
  User,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import styles from './AppLayout.module.css';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: ROUTES.PROFILE, label: 'Profile', icon: <User size={18} /> },
  { to: ROUTES.USERS, label: 'Users', icon: <Users size={18} />, adminOnly: true },
  { to: ROUTES.ROLES, label: 'Roles', icon: <Shield size={18} />, adminOnly: true },
  { to: ROUTES.AUDIT_LOGS, label: 'Audit Logs', icon: <ClipboardList size={18} /> },
  { to: ROUTES.API_DOCS, label: 'API Docs', icon: <BookOpen size={18} /> },
  { to: ROUTES.SETTINGS, label: 'Settings', icon: <Settings size={18} /> },
];

export function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link to={ROUTES.DASHBOARD} className={styles.logo} onClick={() => setSidebarOpen(false)}>
            {APP_NAME}
          </Link>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className={styles.nav}>
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          {user ? (
            <div className={styles.userCard}>
              <div className={styles.avatar}>
                {formatInitials(user.firstName, user.lastName)}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>
                  {formatFullName(user.firstName, user.lastName)}
                </span>
                <span className={styles.userEmail}>{user.email}</span>
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      {sidebarOpen ? (
        <div className={styles.backdrop} onClick={() => setSidebarOpen(false)} aria-hidden />
      ) : null}

      <div className={styles.main}>
        <header className={styles.header}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className={styles.headerActions}>
            <button type="button" className={styles.iconBtn} onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button type="button" className={styles.iconBtn} onClick={logout} aria-label="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
