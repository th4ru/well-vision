import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const BASE = 'http://localhost:4000';
const QA_EMAIL = 'qa-admin-temp@example.com';
const QA2_EMAIL = 'qa-admin-temp2@example.com';
const QA_USER_EMAIL = 'qa-user-temp@example.com';
const PASSWORD = 'QaTempPass123';

const uri = (process.env.MONGODB_URI || '').trim().replace(/^['"]|['"]$/g, '');
await mongoose.connect(uri);
const users = mongoose.connection.collection('users');

const cleanup = async () => {
  await users.deleteMany({ email: { $in: [QA_EMAIL, QA2_EMAIL, QA_USER_EMAIL] } });
};

await cleanup();
const now = new Date();
await users.insertMany([
  { name: 'QA Admin', email: QA_EMAIL, password: await bcrypt.hash(PASSWORD, 10), role: 'Admin', isAccountVerified: true, createdAt: now, updatedAt: now },
  { name: 'QA User', email: QA_USER_EMAIL, password: await bcrypt.hash(PASSWORD, 10), role: 'User', isAccountVerified: true, createdAt: now, updatedAt: now },
]);

const loginAs = async (email, password) => {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  const cookie = (res.headers.getSetCookie?.() || [])
    .map((c) => c.split(';')[0])
    .join('; ');
  return { status: res.status, body, cookie };
};

const results = [];
const admin = await loginAs(QA_EMAIL, PASSWORD);
results.push(['admin login', admin.status, admin.body.user?.role, Boolean(admin.cookie)]);

const list1 = await fetch(`${BASE}/api/admin/management/admins`, {
  headers: { Cookie: admin.cookie },
});
const list1Body = await list1.json();
results.push(['GET admins', list1.status, Array.isArray(list1Body) ? list1Body.length : 'not-array']);

const created = await fetch(`${BASE}/api/admin/management/admins`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: admin.cookie },
  body: JSON.stringify({
    name: 'QA Admin 2',
    email: QA2_EMAIL,
    phone: '0771234567',
    password: PASSWORD,
  }),
});
const createdBody = await created.json();
results.push(['POST create admin', created.status, createdBody.success, createdBody.admin?.email, createdBody.message]);

const duplicate = await fetch(`${BASE}/api/admin/management/admins`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: admin.cookie },
  body: JSON.stringify({ name: 'Dup', email: QA2_EMAIL, password: PASSWORD }),
});
results.push(['POST duplicate', duplicate.status, (await duplicate.json()).message]);

const list2 = await fetch(`${BASE}/api/admin/management/admins`, {
  headers: { Cookie: admin.cookie },
});
const list2Body = await list2.json();
results.push(['GET admins after', list2.status, Array.isArray(list2Body) ? list2Body.length : 'not-array']);

const newAdminLogin = await loginAs(QA2_EMAIL, PASSWORD);
results.push(['new admin login', newAdminLogin.status, newAdminLogin.body.user?.role]);

const normalUser = await loginAs(QA_USER_EMAIL, PASSWORD);
results.push(['normal user login', normalUser.status, normalUser.body.user?.role]);

const forbidden = await fetch(`${BASE}/api/admin/management/admins`, {
  headers: { Cookie: normalUser.cookie },
});
const forbiddenBody = await forbidden.json();
results.push(['GET as normal user', forbidden.status, forbiddenBody.message]);

const anon = await fetch(`${BASE}/api/admin/management/admins`);
results.push(['GET without login', anon.status]);

console.table(results.map(([step, ...rest]) => ({ step, result: rest.join(' | ') })));

await cleanup();
await mongoose.disconnect();
