import { Form, Input, InputNumber, Select } from 'antd';
import type { FormInstance } from 'antd';
import { CrudPage } from '../components/crm/CrudPage';

interface CourseRecord {
  _id: string;
  name: string;
  description?: string;
  duration?: number;
  price?: number;
  status: 'active' | 'inactive';
}

const columns = [
  { title: 'Kurs nomi', dataIndex: 'name' as const },
  { title: 'Ta’rifi', dataIndex: 'description' as const },
  { title: 'Davomiyligi', dataIndex: 'duration' as const },
  { title: 'Narxi', dataIndex: 'price' as const },
  { title: 'Holat', dataIndex: 'status' as const, render: (value: unknown) => <span>{String(value) === 'active' ? 'Faol' : 'Nofaol'}</span> },
];

const renderForm = (_form: FormInstance) => (
  <>
    <Form.Item name="name" label="Kurs nomi" rules={[{ required: true, message: 'Kurs nomi kiriting' }]}> 
      <Input />
    </Form.Item>
    <Form.Item name="description" label="Ta’rifi">
      <Input.TextArea rows={3} />
    </Form.Item>
    <Form.Item name="duration" label="Davomiyligi (oy)">
      <InputNumber min={1} style={{ width: '100%' }} />
    </Form.Item>
    <Form.Item name="price" label="Narxi">
      <InputNumber min={0} style={{ width: '100%' }} />
    </Form.Item>
    <Form.Item name="status" label="Holat" initialValue="active">
      <Select options={[{ value: 'active', label: 'Faol' }, { value: 'inactive', label: 'Nofaol' }]} />
    </Form.Item>
  </>
);

export function CoursesPage() {
  return <CrudPage<CourseRecord> title="Kurslar" endpoint="/superadmin/courses" columns={columns} formItems={renderForm} />;
}
