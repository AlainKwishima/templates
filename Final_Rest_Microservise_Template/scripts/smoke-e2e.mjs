/**
 * Comprehensive end-to-end smoke test against a running stack.
 * Usage: GATEWAY_URL=http://localhost:3000 node scripts/smoke-e2e.mjs
 */

const gatewayUrl = (process.env.GATEWAY_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const DEFAULT_IDS = {
  adminUserId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  adminRoleId: '11111111-1111-1111-1111-111111111111',
  userRoleId: '33333333-3333-3333-3333-333333333333',
  defaultDepartmentId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  defaultResourceId: '44444444-4444-4444-4444-444444444444',
};

const steps = [];
let passed = 0;

async function request(path, init = {}) {
  const url = `${gatewayUrl}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let body = null;
  if (text.length > 0) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }
  return { response, body };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function step(name, fn) {
  steps.push(name);
  return fn().then(() => {
    passed += 1;
    console.log(`  ✓ ${name}`);
  });
}

async function run() {
  console.log(`\nRunning E2E tests against ${gatewayUrl}\n`);

  let accessToken;
  let refreshToken;
  const unique = Date.now();

  await step('swagger ui', async () => {
    const { response } = await request('/api-docs/');
    assert(response.ok || response.status === 301 || response.status === 302, `swagger ui failed: ${response.status}`);
  });

  await step('swagger openapi json', async () => {
    const { response, body } = await request('/api-docs.json');
    assert(response.ok, `api-docs.json failed: ${response.status}`);
    assert(body.openapi?.startsWith('3.'), 'missing openapi version');
    assert(Object.keys(body.paths ?? {}).length > 5, 'aggregated paths missing');
  });

  await step('gateway health', async () => {
    const { response, body } = await request('/health');
    assert(response.ok, `status ${response.status}`);
    assert(body?.success === true, 'missing success');
  });

  await step('auth login (admin)', async () => {
    const { response, body } = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@institution.local', password: 'Admin123!' }),
    });
    assert(response.status === 200, `${response.status} ${JSON.stringify(body)}`);
    accessToken = body.data.accessToken;
    refreshToken = body.data.refreshToken;
    assert(accessToken && refreshToken, 'tokens missing');
  });

  const auth = { authorization: `Bearer ${accessToken}` };

  await step('auth refresh token', async () => {
    const { response, body } = await request('/api/v1/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    assert(response.status === 200, `${response.status} ${JSON.stringify(body)}`);
    accessToken = body.data.accessToken;
    refreshToken = body.data.refreshToken;
  });

  const auth2 = { authorization: `Bearer ${accessToken}` };

  await step('auth register new user', async () => {
    const { response, body } = await request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'E2E',
        lastName: 'User',
        email: `e2e.${unique}@example.com`,
        password: 'TestPass123!',
      }),
    });
    assert(response.status === 201, `${response.status} ${JSON.stringify(body)}`);
    assert(body.data.email === `e2e.${unique}@example.com`, 'email mismatch');
  });

  await step('auth forgot password (no leak)', async () => {
    const { response, body } = await request('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@institution.local' }),
    });
    assert(response.status === 200, `${response.status}`);
    assert(body.success === true, 'forgot-password failed');
  });

  await step('protected route rejects missing auth', async () => {
    const { response } = await request('/api/v1/users');
    assert(response.status === 401, `expected 401 got ${response.status}`);
  });

  await step('list roles', async () => {
    const { response, body } = await request('/api/v1/roles?page=1&limit=10', { headers: auth2 });
    assert(response.ok, `${response.status}`);
    assert(Array.isArray(body.data), 'roles not array');
    assert(body.data.length >= 3, 'expected seeded roles');
  });

  await step('get role by id', async () => {
    const { response, body } = await request(`/api/v1/roles/${DEFAULT_IDS.adminRoleId}`, { headers: auth2 });
    assert(response.ok, `${response.status}`);
    assert(body.data.name === 'Admin', 'admin role name');
  });

  await step('create role', async () => {
    const { response, body } = await request('/api/v1/roles', {
      method: 'POST',
      headers: auth2,
      body: JSON.stringify({ name: `Auditor-${unique}`, description: 'E2E role' }),
    });
    assert(response.status === 201, `${response.status} ${JSON.stringify(body)}`);
    assert(body.data.name === `Auditor-${unique}`, 'role name mismatch');
  });

  await step('list departments', async () => {
    const { response, body } = await request('/api/v1/departments?page=1&limit=10', { headers: auth2 });
    assert(response.ok, `${response.status}`);
    assert(Array.isArray(body.data) && body.data.length >= 1, 'departments empty');
  });

  await step('create department', async () => {
    const { response, body } = await request('/api/v1/departments', {
      method: 'POST',
      headers: auth2,
      body: JSON.stringify({ name: `Dept-${unique}`, description: 'E2E department' }),
    });
    assert(response.status === 201, `${response.status}`);
    assert(body.data.name === `Dept-${unique}`, 'department name');
  });

  await step('list users', async () => {
    const { response, body } = await request('/api/v1/users?page=1&limit=10', { headers: auth2 });
    assert(response.ok, `${response.status}`);
    assert(Array.isArray(body.data), 'users not array');
  });

  await step('get admin user by id', async () => {
    const { response, body } = await request(`/api/v1/users/${DEFAULT_IDS.adminUserId}`, { headers: auth2 });
    assert(response.ok, `${response.status}`);
    assert(body.data.email === 'admin@institution.local', 'admin email');
  });

  await step('list resources', async () => {
    const { response, body } = await request('/api/v1/resources?page=1&limit=10', { headers: auth2 });
    assert(response.ok, `${response.status}`);
    assert(Array.isArray(body.data), 'resources not array');
  });

  let resourceId = DEFAULT_IDS.defaultResourceId;

  await step('create resource', async () => {
    const { response, body } = await request('/api/v1/resources', {
      method: 'POST',
      headers: auth2,
      body: JSON.stringify({
        name: `Resource-${unique}`,
        description: 'E2E resource',
        departmentId: DEFAULT_IDS.defaultDepartmentId,
        status: 'Active',
        quantity: 5,
      }),
    });
    assert(response.status === 201, `${response.status} ${JSON.stringify(body)}`);
    resourceId = body.data.id;
  });

  await step('get resource by id', async () => {
    const { response, body } = await request(`/api/v1/resources/${resourceId}`, { headers: auth2 });
    assert(response.ok, `${response.status}`);
    assert(body.data.id === resourceId, 'resource id');
  });

  let transactionId;

  await step('create transaction', async () => {
    const { response, body } = await request('/api/v1/transactions', {
      method: 'POST',
      headers: auth2,
      body: JSON.stringify({
        userId: DEFAULT_IDS.adminUserId,
        resourceId,
        transactionDate: new Date().toISOString(),
        notes: 'E2E transaction',
      }),
    });
    assert(response.status === 201, `${response.status} ${JSON.stringify(body)}`);
    assert(body.data.status === 'Pending', 'initial status');
    transactionId = body.data.id;
  });

  await step('transition transaction Pending → Active', async () => {
    const { response, body } = await request(`/api/v1/transactions/${transactionId}`, {
      method: 'PUT',
      headers: auth2,
      body: JSON.stringify({ status: 'Active' }),
    });
    assert(response.ok, `${response.status} ${JSON.stringify(body)}`);
    assert(body.data.status === 'Active', 'status not Active');
  });

  await step('transition transaction Active → Completed', async () => {
    const { response, body } = await request(`/api/v1/transactions/${transactionId}`, {
      method: 'PUT',
      headers: auth2,
      body: JSON.stringify({ status: 'Completed' }),
    });
    assert(response.ok, `${response.status}`);
    assert(body.data.status === 'Completed', 'status not Completed');
  });

  await step('list transactions', async () => {
    const { response, body } = await request('/api/v1/transactions?page=1&limit=10', { headers: auth2 });
    assert(response.ok, `${response.status}`);
    assert(Array.isArray(body.data) && body.data.length >= 1, 'transactions empty');
  });

  await step('report: users', async () => {
    const { response, body } = await request('/api/v1/reports/users', { headers: auth2 });
    assert(response.ok, `${response.status} ${JSON.stringify(body)}`);
    assert(typeof body.data.totalUsers === 'number', 'totalUsers missing');
  });

  await step('report: resources', async () => {
    const { response, body } = await request('/api/v1/reports/resources', { headers: auth2 });
    assert(response.ok, `${response.status}`);
    assert(typeof body.data.totalResources === 'number', 'totalResources missing');
  });

  await step('report: transactions', async () => {
    const { response, body } = await request('/api/v1/reports/transactions', { headers: auth2 });
    assert(response.ok, `${response.status}`);
    assert(typeof body.data.totalTransactions === 'number', 'totalTransactions missing');
  });

  await step('report: departments', async () => {
    const { response, body } = await request('/api/v1/reports/departments', { headers: auth2 });
    assert(response.ok, `${response.status}`);
    assert(typeof body.data.totalDepartments === 'number', 'totalDepartments missing');
  });

  await step('dashboard aggregate', async () => {
    const { response, body } = await request('/api/v1/dashboard', { headers: auth2 });
    assert(response.ok, `${response.status}`);
    assert(body.data && typeof body.data === 'object', 'dashboard data missing');
  });

  await step('auth logout', async () => {
    const { response, body } = await request('/api/v1/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    assert(response.status === 200, `${response.status}`);
    assert(body.success === true, 'logout failed');
  });

  await step('refresh token invalid after logout', async () => {
    const { response } = await request('/api/v1/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    assert(response.status === 401, `expected 401 got ${response.status}`);
  });

  console.log(`\n✅ All ${passed} E2E checks passed.\n`);
}

run().catch((error) => {
  console.error(`\n❌ E2E failed at "${steps.at(-1) ?? 'startup'}": ${error.message}\n`);
  process.exit(1);
});
