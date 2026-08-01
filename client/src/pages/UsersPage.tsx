import { Form, Input, Select } from 'antd';
import type { FormInstance } from 'antd';
import { CrudPage } from '../components/crm/CrudPage';

interface UserRecord {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  status: 'active' | 'blocked' | 'pending';
}

const columns = [
  { title: 'F.I.Sh', dataIndex: 'fullName' as const },
  { title: 'Telefon', dataIndex: 'phone' as const },
  { title: 'Email', dataIndex: 'email' as const },
  { title: 'Rol', dataIndex: 'role' as const },
  { title: 'Holat', dataIndex: 'status' as const, render: (value: unknown) => <span>{String(value)}</span> },
];

const renderForm = (_form: FormInstance) => (
  <>
    <Form.Item name="fullName" label="F.I.Sh" rules={[{ required: true, message: 'F.I.Sh kiriting' }]}> 
      <Input />
    </Form.Item>
    <Form.Item name="phone" label="Telefon" rules={[{ required: true, message: 'Telefon kiriting' }]}> 
      <Input />
    </Form.Item>
    <Form.Item name="email" label="Email">
      <Input />
    </Form.Item>
    <Form.Item name="role" label="Rol" rules={[{ required: true, message: 'Rol tanlang' }]}> 
      <Select options={[
        { value: 'SUPER_ADMIN', label: 'SUPER_ADMIN' },
        { value: 'ADMIN', label: 'ADMIN' },
        { value: 'TEACHER', label: 'TEACHER' },
        { value: 'STUDENT', label: 'STUDENT' },
        { value: 'PARENT', label: 'PARENT' },
      ]} />
    </Form.Item>
    <Form.Item name="password" label="Parol" rules={[{ required: true, message: 'Parol kiriting' }]}> 
      <Input.Password />
    </Form.Item>
    <Form.Item name="status" label="Holat" initialValue="active">
      <Select options={[{ value: 'active', label: 'Active' }, { value: 'blocked', label: 'Blocked' }, { value: 'pending', label: 'Pending' }]} />
    </Form.Item>
  </>
);

export function UsersPage() {
  return <CrudPage<UserRecord> title="Foydalanuvchilar" endpoint="/superadmin/users" columns={columns} formItems={renderForm} />;
}
