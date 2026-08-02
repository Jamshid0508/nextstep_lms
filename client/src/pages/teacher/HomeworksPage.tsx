import { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Select } from 'antd';
import type { FormInstance } from 'antd';
import { apiClient } from '../../api/client';
import { CrudPage } from '../../components/crm/CrudPage';

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
}

const columns = [
  { title: 'Mavzu', dataIndex: 'title' as const },
  { title: 'Guruh', dataIndex: 'groupId' as const, render: (value: unknown) => (value as any)?.name ?? '-' },
  { title: 'Yakunlanish', dataIndex: 'dueDate' as const, render: (value: unknown) => String(value).slice(0, 10) || '-' },
  { title: 'Maksimal ball', dataIndex: 'maxScore' as const },
  { title: 'Holat', dataIndex: 'status' as const },
];

export function HomeworksPage() {
  const [references, setReferences] = useState<ReferenceData>({ groups: [] });

  useEffect(() => {
    void apiClient.get<{ success: true; data: ReferenceData }>('/teacher/references').then(({ data }) => {
      setReferences({ groups: data.data.groups ?? [] });
    });
  }, []);

  const renderForm = (_form: FormInstance) => (
    <>
      <Form.Item name="groupId" label="Guruh" rules={[{ required: true, message: 'Guruh tanlang' }]}>
        <Select options={references.groups.map((item) => ({ value: item._id, label: item.name }))} />
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
        <Select options={[
          { value: 'active', label: 'Faol' },
          { value: 'closed', label: 'Yakunlangan' },
        ]} />
      </Form.Item>
    </>
  );

  return <CrudPage<HomeworkRecord> title="O'qituvchi uy vazifalari" endpoint="/teacher/homeworks" columns={columns} formItems={renderForm} />;
}
