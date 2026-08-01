import 'dotenv/config';

const base = 'http://localhost:5000/api/v1';
const loginResponse = await fetch(`${base}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ login: 'superadmin@nextstep.uz', password: 'ChangeMe123!' }),
});
const loginJson = await loginResponse.json();
if (!loginJson?.data?.accessToken) {
  console.error('Login failed', loginJson);
  process.exit(1);
}
const token = loginJson.data.accessToken;
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

const parentPayload = {
  fullName: 'Test Parent',
  phone: '+998910000003',
  email: 'parent-test-3@example.com',
  password: 'Parent123!',
  role: 'PARENT',
  status: 'active',
};
const studentPayload = {
  fullName: 'Test Student',
  phone: '+998910000004',
  email: 'student-test-4@example.com',
  password: 'Student123!',
  role: 'STUDENT',
  status: 'active',
};

const createParentResp = await fetch(`${base}/superadmin/users`, {
  method: 'POST',
  headers,
  body: JSON.stringify(parentPayload),
});
const parentJson = await createParentResp.json();
console.log('PARENT_CREATE_STATUS', createParentResp.status, parentJson);
if (!parentJson?.data?._id) process.exit(1);

const createStudentResp = await fetch(`${base}/superadmin/users`, {
  method: 'POST',
  headers,
  body: JSON.stringify(studentPayload),
});
const studentJson = await createStudentResp.json();
console.log('STUDENT_CREATE_STATUS', createStudentResp.status, studentJson);
if (!studentJson?.data?._id) process.exit(1);

const parentId = parentJson.data._id;
const studentId = studentJson.data._id;

const linkResp = await fetch(`${base}/superadmin/parents/${parentId}/link-child`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ studentId, relationship: 'father' }),
});
const linkJson = await linkResp.json();
console.log('LINK_STATUS', linkResp.status, linkJson);

const childrenResp = await fetch(`${base}/superadmin/parents/${parentId}/children`, { headers });
const childrenJson = await childrenResp.json();
console.log('CHILDREN_STATUS', childrenResp.status, childrenJson);

process.exit(0);
