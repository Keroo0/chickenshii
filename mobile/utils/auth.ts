import type { StaffRole } from "../types/index.ts";

export type RoleHomeRoute = "/admin" | "/doctor" | "/head-worker";

const ROLE_HOME_ROUTES: Record<StaffRole, RoleHomeRoute> = {
  admin: "/admin",
  veterinarian: "/doctor",
  head_worker: "/head-worker",
};

export function getRoleHomeRoute(role: unknown): RoleHomeRoute | null {
  if (typeof role !== "string") return null;
  return ROLE_HOME_ROUTES[role as StaffRole] ?? null;
}

export function getRoleFromUser(user: unknown): StaffRole | null {
  if (!user || typeof user !== "object" || !("app_metadata" in user)) {
    return null;
  }

  const metadata = user.app_metadata;
  if (!metadata || typeof metadata !== "object" || !("role" in metadata)) {
    return null;
  }

  const role = metadata.role;
  return getRoleHomeRoute(role) ? (role as StaffRole) : null;
}
