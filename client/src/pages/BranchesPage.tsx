import { Form, Input, Select } from 'antd';
import type { FormInstance } from 'antd';
import { CrudPage } from '../components/crm/CrudPage';

interface BranchRecord {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  status: 'active' | 'inactive';
}

const columns = [
  { title: 'Filial nomi', dataIndex: 'name' as const },
  { title: 'Manzil', dataIndex: 'address' as const },
  { title: 'Telefon', dataIndex: 'phone' as const },
  { title: 'Holat', dataIndex: 'status' as const, render: (value: unknown) => <span>{String(value) === 'active' ? 'Faol' : 'Nofaol'}</span> },
];

const renderForm = (_form: FormInstance) => (
  <>
    <Form.Item name="name" label="Filial nomi" rules={[{ required: true, message: 'Filial nomi kiriting' }]}
    >
      <Input />
    </Form.Item>
    <Form.Item name="address" label="Manzil">
      <Input />
    </Form.Item>
    <Form.Item name="phone" label="Telefon">
      <Input />
    </Form.Item>
    <Form.Item name="status" label="Holat" initialValue="active">
      <Select options={[{ value: 'active', label: 'Faol' }, { value: 'inactive', label: 'Nofaol' }]} />
    </Form.Item>
  </>
);

export function BranchesPage() {
  return <CrudPage<BranchRecord> title="Filiallar" endpoint="/superadmin/branches" columns={columns} formItems={renderForm} />;
}
