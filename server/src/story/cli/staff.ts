/**
 * Staff provisioning CLI (no default accounts exist; this is how the first system admin is created).
 *
 *   STAFF_PASSWORD='…' npm run staff -- create --username admin.sistem --name "Admin Sistem" --roles system_admin
 *   npm run staff -- list
 *   npm run staff -- roles --username budi --roles host,author
 *   STAFF_PASSWORD='…' npm run staff -- password --username budi
 *   npm run staff -- deactivate --username budi
 *
 * The password is read from the STAFF_PASSWORD environment variable (never a command-line argument, which would end up
 * in shell history). Uses the same DB_FILE as the server (.env / environment).
 */
import os from 'node:os';
import { isStaffRole, STAFF_ROLES, type StaffRole } from '../../../../shared/story/roles';
import { createStaff, findStaffByUsername, listStaff, setStaffActive, setStaffPassword, setStaffRoles, StaffError } from '../auth/staff';
import type { AuditActor } from '../auth/audit';
import { closeDb } from '../../db';

const ACTOR: AuditActor = { id: null, name: `cli:${os.userInfo().username}` };

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function roles(): StaffRole[] {
  const raw = (arg('roles') ?? '').split(',').map((r) => r.trim()).filter(Boolean);
  const bad = raw.filter((r) => !isStaffRole(r));
  if (bad.length) throw new StaffError(`Peran tidak dikenal: ${bad.join(', ')}. Pilihan: ${STAFF_ROLES.join(', ')}`);
  return raw.filter(isStaffRole);
}

function password(): string {
  const p = process.env.STAFF_PASSWORD ?? '';
  if (!p) throw new StaffError('Isi kata sandi lewat variabel lingkungan STAFF_PASSWORD.');
  return p;
}

function user(): NonNullable<ReturnType<typeof findStaffByUsername>> {
  const u = findStaffByUsername(arg('username') ?? '');
  if (!u) throw new StaffError('Pengguna tidak ditemukan.');
  return u;
}

function main(): void {
  const cmd = process.argv[2];
  switch (cmd) {
    case 'create': {
      const u = createStaff({ username: arg('username') ?? '', displayName: arg('name') ?? '', password: password(), roles: roles() }, ACTOR);
      console.log(`Dibuat: ${u.username} (${u.roles.join(', ')})`);
      break;
    }
    case 'list':
      for (const u of listStaff()) console.log(`${u.active ? ' ' : 'x'} ${u.username.padEnd(24)} ${u.roles.join(', ')}`);
      break;
    case 'roles': {
      const u = setStaffRoles(user().id, roles(), ACTOR);
      console.log(`Peran ${u.username}: ${u.roles.join(', ')}`);
      break;
    }
    case 'password':
      setStaffPassword(user().id, password(), ACTOR);
      console.log('Kata sandi diganti; sesi lama dicabut.');
      break;
    case 'deactivate':
      setStaffActive(user().id, false, ACTOR);
      console.log('Akun dinonaktifkan.');
      break;
    default:
      console.log('Perintah: create | list | roles | password | deactivate (lihat komentar di server/src/story/cli/staff.ts)');
      process.exitCode = 1;
  }
}

try {
  main();
} catch (err) {
  console.error(err instanceof StaffError ? err.message : err);
  process.exitCode = 1;
} finally {
  closeDb();
}
