import { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Select } from 'antd';
import type { FormInstance } from 'antd';
import { apiClient } from '../api/client';
import { CrudPage } from '../components/crm/CrudPage';

interface GroupRecord {
  _id: string;
  name: string;
  courseId?: { name?: string };
  teacherId?: { fullName?: string };
  branchId?: { name?: string };
  room?: string;
  maxStudents?: number;
  status: 'active' | 'inactive' | 'completed';
}

interface ReferenceData {
  branches: Array<{ _id: string; name: string }>;
  courses: Array<{ _id: string; name: string }>;
  teachers: Array<{ _id: string; fullName: string }>;
}

const columns = [
  { title: 'Guruh nomi', dataIndex: 'name' as const },
  { title: 'Kurs', dataIndex: 'courseId' as const, render: (value: unknown) => (value as any)?.name ?? '-' },
  { title: 'O’qituvchi', dataIndex: 'teacherId' as const, render: (value: unknown) => (value as any)?.fullName ?? '-' },
  { title: 'Filial', dataIndex: 'branchId' as const, render: (value: unknown) => (value as any)?.name ?? '-' },
  { title: 'Xona', dataIndex: 'room' as const },
  { title: 'Max talaba', dataIndex: 'maxStudents' as const },
  { title: 'Holat', dataIndex: 'status' as const, render: (value: unknown) => <span>{String(value)}</span> },
];

export function GroupsPage() {
  const [references, setReferences] = useState<ReferenceData>({ branches: [], courses: [], teachers: [] });

  useEffect(() => {
    apiClient.get<{ success: true; data: ReferenceData }>('/superadmin/references').then(({ data }) => setReferences(data.data));
  }, []);

  const renderForm = (_form: FormInstance) => (
    <>
      <Form.Item name="name" label="Guruh nomi" rules={[{ required: true, message: 'Guruh nomi kiriting' }]}> 
        <Input />
      </Form.Item>
      <Form.Item name="courseId" label="Kurs" rules={[{ required: true, message: 'Kurs tanlang' }]}> 
        <Select options={references.courses.map((item) => ({ value: item._id, label: item.name }))} />
      </Form.Item>
      <Form.Item name="teacherId" label="O’qituvchi">
        <Select allowClear options={references.teachers.map((item) => ({ value: item._id, label: item.fullName }))} />
      </Form.Item>
      <Form.Item name="branchId" label="Filial" rules={[{ required: true, message: 'Filial tanlang' }]}> 
        <Select options={references.branches.map((item) => ({ value: item._id, label: item.name }))} />
      </Form.Item>
      <Form.Item name="room" label="Xona">
        <Input />
      </Form.Item>
      <Form.Item name="maxStudents" label="Maksimal talaba soni">
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="status" label="Holat" initialValue="active">
        <Select options={[{ value: 'active', label: 'Faol' }, { value: 'inactive', label: 'Nofaol' }, { value: 'completed', label: 'Yakunlangan' }]} />
      </Form.Item>
    </>
  );

  return <CrudPage<GroupRecord> title="Guruhlar" endpoint="/superadmin/groups" columns={columns} formItems={renderForm} />;
}
