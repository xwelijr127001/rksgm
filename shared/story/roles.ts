/**
 * Internal staff roles (PRD FR-E3). Separate from anonymous participants. A user may hold several roles; there is no
 * implicit super-user — `system_admin` manages users, categories and the asset library, nothing else, unless it is
 * explicitly granted other roles too. Server enforcement: server/src/story/auth/permissions.ts.
 */

export const STAFF_ROLES = ['host', 'author', 'reviewer', 'competition_admin', 'system_admin'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_LABEL: Record<StaffRole, string> = {
  host: 'Host room',
  author: 'Penulis konten (Story/Storyline)',
  reviewer: 'Reviewer / komite kunci jawaban',
  competition_admin: 'Panitia kompetisi',
  system_admin: 'Admin sistem',
};

export interface StaffIdentity {
  id: string;
  username: string;
  displayName: string;
  roles: StaffRole[];
}

export function isStaffRole(v: unknown): v is StaffRole {
  return typeof v === 'string' && (STAFF_ROLES as readonly string[]).includes(v);
}

/** Capabilities and the roles that grant them. The client uses this only to hide controls; the server enforces it. */
export const CAPABILITIES = {
  hostRooms: ['host'],
  readScenarios: ['author', 'reviewer', 'system_admin'],
  editScenarios: ['author'],
  reviewScenarios: ['reviewer'],
  archiveScenarios: ['reviewer', 'system_admin'],
  manageAssets: ['system_admin'],
  readAssets: ['author', 'reviewer', 'system_admin'],
  manageCategories: ['system_admin'],
  readReports: ['competition_admin'],
  managePeriods: ['competition_admin'],
  readAudit: ['competition_admin', 'system_admin'],
  /** Close any live room (a host who left, a deactivated host); used from Admin → Room. */
  closeRooms: ['competition_admin'],
  manageUsers: ['system_admin'],
} as const satisfies Record<string, readonly StaffRole[]>;

export type Capability = keyof typeof CAPABILITIES;

export function can(roles: readonly StaffRole[], cap: Capability): boolean {
  return (CAPABILITIES[cap] as readonly StaffRole[]).some((r) => roles.includes(r));
}
