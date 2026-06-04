import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { platform } from 'node:os';

const rootDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(rootDir, '..');

const workspaces = [
  'packages/shared',
  'services/auth-service',
  'services/user-service',
  'services/role-service',
  'services/department-service',
  'services/resource-service',
  'services/transaction-service',
  'services/notification-service',
  'services/report-service',
  'services/dashboard-service',
  'services/api-gateway',
];

const failures = [];

let sharedBuilt = false;

function run(command, args, cwd) {
  return spawnSync(command, args, {
    cwd: join(repoRoot, cwd),
    stdio: 'inherit',
    shell: false,
  });
}

const isWindows = platform() === 'win32';
const npmCommand = isWindows ? 'cmd.exe' : 'npm';
const npmArgs = (args) => (isWindows ? ['/c', 'npm', ...args] : args);

const sharedBuild = run(npmCommand, npmArgs(['run', 'build', '-w', 'packages/shared']), '.');
sharedBuilt = sharedBuild.status === 0;

if (!sharedBuilt) {
  process.exit(sharedBuild.status ?? 1);
}

for (const workspace of workspaces) {
  const result = run(npmCommand, npmArgs(['test']), workspace);

  if (result.status !== 0) {
    failures.push(workspace);
  }
}

if (failures.length > 0) {
  console.error(`test:all failed for: ${failures.join(', ')}`);
  process.exit(1);
}
