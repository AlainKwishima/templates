import { FormEvent, useState, type CSSProperties } from "react";
import { env } from "@/config/env";
import {
  useAuthSession,
  useLoginMutation,
  useLogoutMutation,
} from "@/features/auth/auth.hooks";
import {
  useHealthCheckQuery,
  useLivenessQuery,
  useReadinessQuery,
} from "@/features/health/health.hooks";

function StatusBadge({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: "0.5rem 0" }}>
      <span style={{ color: "#64748b" }}>{label}</span>
      <span style={{ color: ok === undefined ? "#0f172a" : ok ? "#15803d" : "#b91c1c", fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}

export function App() {
  const session = useAuthSession();
  const health = useHealthCheckQuery();
  const liveness = useLivenessQuery();
  const readiness = useReadinessQuery();
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();

  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin123!");

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    await loginMutation.mutateAsync({ email, password });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "Segoe UI, system-ui, sans-serif",
        padding: "2rem",
      }}
    >
      <main style={{ maxWidth: "720px", margin: "0 auto", display: "grid", gap: "1.5rem" }}>
        <header>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.875rem" }}>Template status dashboard</p>
          <h1 style={{ margin: "0.25rem 0 0", fontSize: "2rem" }}>{env.VITE_APP_NAME}</h1>
        </header>

        <section style={cardStyle}>
          <h2 style={headingStyle}>API health</h2>
          <StatusBadge
            label="Full health"
            value={health.isLoading ? "Checking..." : health.isError ? "Error" : health.data?.status ?? "Unknown"}
            ok={health.isSuccess}
          />
          <StatusBadge
            label="Liveness"
            value={liveness.isLoading ? "Checking..." : liveness.isError ? "Error" : "alive"}
            ok={liveness.isSuccess}
          />
          <StatusBadge
            label="Readiness"
            value={readiness.isLoading ? "Checking..." : readiness.isError ? "Error" : "ready"}
            ok={readiness.isSuccess}
          />
          <p style={{ margin: "1rem 0 0", fontSize: "0.875rem", color: "#64748b" }}>
            Backend: {env.VITE_API_BASE_URL}
          </p>
        </section>

        <section style={cardStyle}>
          <h2 style={headingStyle}>Authentication</h2>
          {session ? (
            <div>
              <StatusBadge label="Signed in as" value={session.user.email} />
              <StatusBadge label="Roles" value={session.user.roles.join(", ") || "none"} />
              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                style={buttonStyle}
              >
                {logoutMutation.isPending ? "Signing out..." : "Sign out"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} style={{ display: "grid", gap: "0.75rem" }}>
              <label style={labelStyle}>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  style={inputStyle}
                />
              </label>
              <button type="submit" disabled={loginMutation.isPending} style={buttonStyle}>
                {loginMutation.isPending ? "Signing in..." : "Sign in with seeded admin"}
              </button>
            </form>
          )}
          {(loginMutation.error || logoutMutation.error) && (
            <p style={{ color: "#b91c1c", marginTop: "0.75rem" }}>
              {(loginMutation.error ?? logoutMutation.error)?.message}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

const cardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "1.25rem",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
};

const headingStyle: CSSProperties = {
  margin: "0 0 1rem",
  fontSize: "1.125rem",
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: "0.35rem",
  fontSize: "0.875rem",
  color: "#334155",
};

const inputStyle: CSSProperties = {
  padding: "0.65rem 0.75rem",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "1rem",
};

const buttonStyle: CSSProperties = {
  marginTop: "0.5rem",
  padding: "0.7rem 1rem",
  borderRadius: "8px",
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  fontWeight: 600,
  cursor: "pointer",
};
