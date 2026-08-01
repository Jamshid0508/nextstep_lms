import { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Select } from 'antd';
import type { FormInstance } from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '../api/client';
import { CrudPage } from '../components/crm/CrudPage';

interface HomeworkRecord {
  _id: string;
  groupId?: { name?: string };
  teacherId?: { fullName?: string };
  title?: string;
  dueDate?: string;
  maxScore?: number;
  status?: string;
}

interface ReferenceData {
  groups: Array<{ _id: string; name: string }>;
  teachers: Array<{ _id: string; fullName: string }>;
}

const columns = [
  { title: 'Mavzu', dataIndex: 'title' as const },
  { title: 'Guruh', dataIndex: 'groupId' as const, render: (value: unknown) => (value as any)?.name ?? '-' },
  { title: 'O’qituvchi', dataIndex: 'teacherId' as const, render: (value: unknown) => (value as any)?.fullName ?? '-' },
  { title: 'Yakunlanish', dataIndex: 'dueDate' as const, render: (value: unknown) => value ? dayjs(String(value)).format('DD.MM.YYYY') : '-' },
  { title: 'Maksimal ball', dataIndex: 'maxScore' as const },
  { title: 'Holat', dataIndex: 'status' as const },
];

export function HomeworksPage() {
  const [references, setReferences] = useState<ReferenceData>({ groups: [], teachers: [] });

  useEffect(() => {
    void apiClient.get<{ success: true; data: ReferenceData }>('/superadmin/references').then(({ data }) => {
      setReferences({
        groups: data.data.groups ?? [],
        teachers: data.data.teachers ?? [],
      });
    });
  }, []);

  const renderForm = (_form: FormInstance) => (
    <>
      <Form.Item name="groupId" label="Guruh" rules={[{ required: true, message: 'Guruh tanlang' }]}> 
        <Select options={references.groups.map((item) => ({ value: item._id, label: item.name }))} />
      </Form.Item>
      <Form.Item name="teacherId" label="O’qituvchi" rules={[{ required: true, message: 'O’qituvchi tanlang' }]}> 
        <Select options={references.teachers.map((item) => ({ value: item._id, label: item.fullName }))} />
      </Form.Item>
      <Form.Item name="title" label="Mavzu" rules={[{ required: true, message: 'Mavzu kiriting' }]}> 
        <Input />
      </Form.Item>
      <Form.Item name="description" label="Tavsif">
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item name="dueDate" label="Yakunlanish sanasi" rules={[{ required: true, message: 'Yakunlanish sanasi kiriting' }]}> 
        <Input type="date" />
      </Form.Item>
      <Form.Item name="maxScore" label="Maksimal ball">
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="status" label="Holat" initialValue="active">
        <Select options={[{ value: 'active', label: 'Active' }, { value: 'closed', label: 'Closed' }]} />
      </Form.Item>
    </>
  );

  return <CrudPage<HomeworkRecord> title="Uy vazifalari" endpoint="/superadmin/homeworks" columns={columns} formItems={renderForm} />;
}
