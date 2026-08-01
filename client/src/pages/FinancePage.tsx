import { Form, Input, InputNumber, Select } from 'antd';
import type { FormInstance } from 'antd';
import dayjs from 'dayjs';
import { CrudPage } from '../components/crm/CrudPage';

interface FinanceRecord {
  _id: string;
  name: string;
  kind?: 'expense' | 'income';
  amount?: number;
  date?: string;
  description?: string;
}

const columns = [
  { title: 'Sarlavha', dataIndex: 'name' as const },
  { title: 'Turi', dataIndex: 'kind' as const },
  { title: 'Summa', dataIndex: 'amount' as const },
  { title: 'Sana', dataIndex: 'date' as const, render: (value: unknown) => value ? dayjs(String(value)).format('DD.MM.YYYY') : '-' },
  { title: 'Tavsif', dataIndex: 'description' as const },
];

const renderForm = (_form: FormInstance) => (
  <>
    <Form.Item name="name" label="Sarlavha" rules={[{ required: true, message: 'Sarlavha kiriting' }]}> 
      <Input />
    </Form.Item>
    <Form.Item name="kind" label="Turi" rules={[{ required: true, message: 'Turi tanlang' }]}> 
      <Select options={[{ value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }]} />
    </Form.Item>
    <Form.Item name="amount" label="Summa" rules={[{ required: true, message: 'Summa kiriting' }]}> 
      <InputNumber min={0} style={{ width: '100%' }} />
    </Form.Item>
    <Form.Item name="date" label="Sana" rules={[{ required: true, message: 'Sana kiriting' }]}> 
      <Input type="date" />
    </Form.Item>
    <Form.Item name="description" label="Tavsif">
      <Input.TextArea rows={3} />
    </Form.Item>
  </>
);

export function FinancePage() {
  return <CrudPage<FinanceRecord> title="Moliya" endpoint="/superadmin/finance" columns={columns} formItems={renderForm} />;
}
