import { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Select } from 'antd';
import type { FormInstance } from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '../api/client';
import { CrudPage } from '../components/crm/CrudPage';

interface PaymentRecord {
  _id: string;
  studentId?: { fullName?: string };
  groupId?: { name?: string };
  amount?: number;
  paymentDate?: string;
  paymentType?: string;
  paymentMethod?: string;
  status?: string;
  note?: string;
}

interface ReferenceData {
  students: Array<{ _id: string; fullName: string }>;
  groups: Array<{ _id: string; name: string }>;
}

const columns = [
  { title: 'Talaba', dataIndex: 'studentId' as const, render: (value: unknown) => (value as any)?.fullName ?? '-' },
  { title: 'Guruh', dataIndex: 'groupId' as const, render: (value: unknown) => (value as any)?.name ?? '-' },
  { title: 'Summa', dataIndex: 'amount' as const },
  { title: 'Tur', dataIndex: 'paymentType' as const },
  { title: 'Usul', dataIndex: 'paymentMethod' as const },
  { title: 'Holat', dataIndex: 'status' as const },
  { title: 'Sana', dataIndex: 'paymentDate' as const, render: (value: unknown) => value ? dayjs(String(value)).format('DD.MM.YYYY') : '-' },
  { title: 'Izoh', dataIndex: 'note' as const },
];

export function PaymentsPage() {
  const [references, setReferences] = useState<ReferenceData>({ students: [], groups: [] });

  useEffect(() => {
    void apiClient.get<{ success: true; data: ReferenceData }>('/superadmin/references').then(({ data }) => {
      setReferences({
        students: data.data.students ?? [],
        groups: data.data.groups ?? [],
      });
    });
  }, []);

  const renderForm = (_form: FormInstance) => (
    <>
      <Form.Item name="studentId" label="Talaba" rules={[{ required: true, message: 'Talaba tanlang' }]}> 
        <Select options={references.students.map((item) => ({ value: item._id, label: item.fullName }))} />
      </Form.Item>
      <Form.Item name="groupId" label="Guruh" rules={[{ required: true, message: 'Guruh tanlang' }]}> 
        <Select options={references.groups.map((item) => ({ value: item._id, label: item.name }))} />
      </Form.Item>
    <Form.Item name="amount" label="Summa" rules={[{ required: true, message: 'Summa kiriting' }]}> 
      <InputNumber min={0} style={{ width: '100%' }} />
    </Form.Item>
    <Form.Item name="paymentType" label="To’lov turi" rules={[{ required: true, message: 'Tur tanlang' }]}> 
      <Select options={[{ value: 'monthly', label: 'Monthly' }, { value: 'one_time', label: 'One time' }, { value: 'discount', label: 'Discount' }, { value: 'penalty', label: 'Penalty' }]} />
    </Form.Item>
    <Form.Item name="paymentMethod" label="To’lov usuli">
      <Select options={[{ value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' }, { value: 'transfer', label: 'Transfer' }]} />
    </Form.Item>
    <Form.Item name="status" label="Holat" initialValue="pending">
      <Select options={[{ value: 'pending', label: 'Pending' }, { value: 'paid', label: 'Paid' }, { value: 'overdue', label: 'Overdue' }, { value: 'cancelled', label: 'Cancelled' }]} />
    </Form.Item>
    <Form.Item name="paymentDate" label="To’lov sanasi">
      <Input type="date" />
    </Form.Item>
    <Form.Item name="note" label="Izoh">
      <Input.TextArea rows={3} />
    </Form.Item>
    </>
  );

  return <CrudPage<PaymentRecord> title="To’lovlar" endpoint="/superadmin/payments" columns={columns} formItems={renderForm} />;
}
