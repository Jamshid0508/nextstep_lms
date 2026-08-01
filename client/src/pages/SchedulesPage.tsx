import { useEffect, useState } from 'react';
import { Form, Input, Select } from 'antd';
import type { FormInstance } from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '../api/client';
import { CrudPage } from '../components/crm/CrudPage';

interface ScheduleRecord {
  _id: string;
  groupId?: { name?: string };
  teacherId?: { fullName?: string };
  weekDays?: string[];
  startTime?: string;
  endTime?: string;
  startDate?: string;
  notes?: string;
}

interface ReferenceData {
  groups: Array<{ _id: string; name: string }>;
  teachers: Array<{ _id: string; fullName: string }>;
}

const columns = [
  { title: 'Guruh', dataIndex: 'groupId' as const, render: (value: unknown) => (value as any)?.name ?? '-' },
  { title: 'O’qituvchi', dataIndex: 'teacherId' as const, render: (value: unknown) => (value as any)?.fullName ?? '-' },
  { title: 'Kunlar', dataIndex: 'weekDays' as const, render: (value: unknown) => String((value as string[])?.join(', ') ?? '-') },
  { title: 'Boshlanish', dataIndex: 'startTime' as const },
  { title: 'Tugash', dataIndex: 'endTime' as const },
  { title: 'Boshlanish sanasi', dataIndex: 'startDate' as const, render: (value: unknown) => value ? dayjs(String(value)).format('DD.MM.YYYY') : '-' },
  { title: 'Izoh', dataIndex: 'notes' as const },
];

export function SchedulesPage() {
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
      <Form.Item name="teacherId" label="O’qituvchi">
        <Select allowClear options={references.teachers.map((item) => ({ value: item._id, label: item.fullName }))} />
      </Form.Item>
      <Form.Item name="weekDays" label="Dars kunlari">
        <Select mode="multiple" options={['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((day) => ({ value: day, label: day }))} />
      </Form.Item>
      <Form.Item name="startTime" label="Boshlanish vaqti" rules={[{ required: true, message: 'Boshlanish vaqtini kiriting' }]}> 
        <Input />
      </Form.Item>
      <Form.Item name="endTime" label="Tugash vaqti" rules={[{ required: true, message: 'Tugash vaqtini kiriting' }]}> 
        <Input />
      </Form.Item>
      <Form.Item name="startDate" label="Boshlanish sanasi">
        <Input type="date" />
      </Form.Item>
      <Form.Item name="notes" label="Izoh">
        <Input.TextArea rows={3} />
      </Form.Item>
    </>
  );

  return <CrudPage<ScheduleRecord> title="Dars jadvali" endpoint="/superadmin/schedules" columns={columns} formItems={renderForm} />;
}
