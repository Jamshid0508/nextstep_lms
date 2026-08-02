import { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Select } from 'antd';
import type { FormInstance } from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '../api/client';
import { CrudPage } from '../components/crm/CrudPage';

interface QuizRecord {
  _id: string;
  groupId?: { name?: string };
  teacherId?: { fullName?: string };
  title?: string;
  availableFrom?: string;
  availableTo?: string;
  attemptsAllowed?: number;
  status?: string;
}

interface ReferenceData {
  groups: Array<{ _id: string; name: string }>;
  teachers: Array<{ _id: string; fullName: string }>;
}

const QUIZ_STATUS_LABELS: Record<string, string> = {
  draft: 'Qoralama',
  published: 'Nashr qilingan',
  closed: 'Yakunlangan',
};

const columns = [
  { title: 'Test', dataIndex: 'title' as const },
  { title: 'Guruh', dataIndex: 'groupId' as const, render: (value: unknown) => (value as any)?.name ?? '-' },
  { title: "O'qituvchi", dataIndex: 'teacherId' as const, render: (value: unknown) => (value as any)?.fullName ?? '-' },
  { title: 'Boshlanish', dataIndex: 'availableFrom' as const, render: (value: unknown) => value ? dayjs(String(value)).format('DD.MM.YYYY') : '-' },
  { title: 'Tugash', dataIndex: 'availableTo' as const, render: (value: unknown) => value ? dayjs(String(value)).format('DD.MM.YYYY') : '-' },
  { title: 'Urinishlar', dataIndex: 'attemptsAllowed' as const },
  { title: 'Holat', dataIndex: 'status' as const, render: (v: unknown) => QUIZ_STATUS_LABELS[String(v)] ?? String(v ?? '-') },
];

export function QuizzesPage() {
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
      <Form.Item name="title" label="Test nomi" rules={[{ required: true, message: 'Test nomi kiriting' }]}> 
        <Input />
      </Form.Item>
      <Form.Item name="description" label="Tavsif">
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item name="availableFrom" label="Boshlanish sanasi">
        <Input type="date" />
      </Form.Item>
      <Form.Item name="availableTo" label="Tugash sanasi">
        <Input type="date" />
      </Form.Item>
      <Form.Item name="attemptsAllowed" label="Urinishlar soni">
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="status" label="Holat" initialValue="draft">
        <Select options={[
          { value: 'draft', label: 'Qoralama' },
          { value: 'published', label: 'Nashr qilingan' },
          { value: 'closed', label: 'Yakunlangan' },
        ]} />
      </Form.Item>
    </>
  );

  return <CrudPage<QuizRecord> title="Testlar" endpoint="/superadmin/quizzes" columns={columns} formItems={renderForm} />;
}
