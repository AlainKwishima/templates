export const queryKeys = {
  auth: {
    root: ["auth"] as const,
    me: ["auth", "me"] as const,
  },
  health: {
    root: ["health"] as const,
  },
  users: {
    root: ["users"] as const,
    me: ["users", "me"] as const,
    list: (filters?: Record<string, unknown>) => ["users", "list", filters ?? {}] as const,
    roles: ["users", "roles"] as const,
  },
  files: {
    root: ["files"] as const,
    list: (filters?: Record<string, unknown>) => ["files", "list", filters ?? {}] as const,
  },
};
