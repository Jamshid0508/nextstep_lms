import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Form, Input, Modal, Select, Space, Table, message } from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '../api/client';

interface AttendanceRecord {
  _id: string;
  groupId?: { name?: string };
  lessonDate?: string;
  lessonStartTime?: string;
  lessonEndTime?: string;
  markedBy?: { fullName?: string };
  records?: Array<{ studentId?: { fullName?: string }; status?: string; note?: string }>;
}

interface ReferenceData {
  groups: Array<{ _id: string; name: string }>;
  students: Array<{ _id: string; fullName: string }>;
  teachers: Array<{ _id: string; fullName: string }>;
}

const attendanceStatuses = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' },
];

export function AttendancePage() {
  const [items, setItems] = useState<AttendanceRecord[]>([]);
  const [references, setReferences] = useState<ReferenceData>({ groups: [], students: [], teachers: [] });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: AttendanceRecord[] }>('/superadmin/attendance');
      setItems(data.data);
    } catch {
      message.error('Davomat ma’lumotlarini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
    void apiClient.get<{ success: true; data: ReferenceData }>('/superadmin/references').then(({ data }) => {
      setReferences({
        groups: data.data.groups ?? [],
        students: data.data.students ?? [],
        teachers: data.data.teachers ?? [],
      });
    });
  }, []);

  const columns = useMemo(
    () => [
      { title: 'Guruh', dataIndex: 'groupId', render: (value: unknown) => (value as any)?.name ?? '-' },
      { title: 'Sana', dataIndex: 'lessonDate', render: (value: unknown) => value ? dayjs(String(value)).format('DD.MM.YYYY') : '-' },
      { title: 'Boshlanish', dataIndex: 'lessonStartTime' },
      { title: 'Tugash', dataIndex: 'lessonEndTime' },
      { title: 'Belgilagan', dataIndex: 'markedBy', render: (value: unknown) => (value as any)?.fullName ?? '-' },
      { title: 'Talabalar', dataIndex: 'records', render: (value: unknown) => String((value as any[])?.length ?? 0) },
      {
        title: 'Harakatlar',
        key: 'actions',
        render: (_value: unknown, record: AttendanceRecord) => (
          <Space>
            <Button size="small" danger onClick={() => handleDelete(String((record as any)._id))}>
              O’chirish
            </Button>
          </Space>
        ),
      },
    ],
    [items],
  );

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/superadmin/attendance/${id}`);
      message.success('Davomat yozuvi o’chirildi');
      await fetchItems();
    } catch {
      message.error('Davomat yozuvini o’chirishda xatolik yuz berdi');
    }
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await apiClient.post('/superadmin/attendance', values);
      message.success('Davomat saqlandi');
      form.resetFields();
      setOpen(false);
      await fetchItems();
    } catch {
      message.error('Davomatni saqlashda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      title="Davomat"
      extra={
        <Button type="primary" onClick={() => setOpen(true)}>
          Yangi qo’shish
        </Button>
      }
    >
      <Table rowKey="_id" columns={columns} dataSource={items} loading={loading} />

      <Modal
        open={open}
        title="Davomat qo’shish"
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        onOk={handleCreate}
        okText="Saqlash"
        confirmLoading={submitting}
        width={900}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="groupId" label="Guruh" rules={[{ required: true, message: 'Guruh tanlang' }]}>
            <Select options={references.groups.map((item) => ({ value: item._id, label: item.name }))} />
          </Form.Item>
          <Form.Item name="lessonDate" label="Sana" rules={[{ required: true, message: 'Sana kiriting' }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="lessonStartTime" label="Boshlanish vaqti">
            <Input />
          </Form.Item>
          <Form.Item name="lessonEndTime" label="Tugash vaqti">
            <Input />
          </Form.Item>
          <Form.Item name="markedBy" label="Belgilagan foydalanuvchi">
            <Select allowClear options={[...references.teachers, ...references.students].map((item) => ({ value: item._id, label: item.fullName }))} />
          </Form.Item>

          <Form.List name="records" initialValue={references.students.map((student) => ({ studentId: student._id, status: 'present', note: '' }))}>
            {(fields) => (
              <Space direction="vertical" style={{ width: '100%' }}>
                {fields.map((field) => (
                  <Space key={field.key} align="start" style={{ width: '100%' }}>
                    <Form.Item
                      {...field}
                      name={[field.name, 'studentId']}
                      label="Talaba"
                      rules={[{ required: true, message: 'Talaba tanlang' }]}
                      style={{ minWidth: 240 }}
                    >
                      <Select options={references.students.map((item) => ({ value: item._id, label: item.fullName }))} />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'status']}
                      label="Holat"
                      rules={[{ required: true, message: 'Holat tanlang' }]}
                      style={{ minWidth: 180 }}
                    >
                      <Select options={attendanceStatuses} />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'note']} label="Izoh" style={{ minWidth: 280 }}>
                      <Input />
                    </Form.Item>
                  </Space>
                ))}
              </Space>
            )}
          </Form.List>
        </Form>
      </Modal>
    </Card>
  );
}
