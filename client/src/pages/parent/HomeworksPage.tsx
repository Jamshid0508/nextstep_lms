import { useEffect, useState } from 'react';
import { Card, Table, Select, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '../../api/client';

interface ChildRecord {
  _id: string;
  studentId?: { _id?: string; fullName?: string; phone?: string; email?: string; status?: string };
  relationship?: string;
}

interface HomeworkRecord {
  _id: string;
  title?: string;
  groupId?: { name?: string };
  teacherId?: { fullName?: string };
  dueDate?: string;
  status?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Faol', color: 'blue' },
  closed: { label: 'Yakunlangan', color: 'default' },
  submitted: { label: 'Topshirilgan', color: 'green' },
  graded: { label: 'Baholangan', color: 'purple' },
  late: { label: 'Kechikkan', color: 'orange' },
  not_submitted: { label: 'Topshirilmagan', color: 'red' },
};

export function HomeworksPage() {
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [items, setItems] = useState<HomeworkRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadChildren = async () => {
    try {
      const { data } = await apiClient.get<{ success: true; data: ChildRecord[] }>('/parent/children');
      setChildren(data.data);
      if (data.data.length > 0 && !selectedChildId) {
        // studentId._id ni tanlaymiz (talabaning o'z User IDsi)
        const firstStudentId = data.data[0].studentId?._id;
        if (firstStudentId) setSelectedChildId(firstStudentId);
      }
    } catch {
      message.error('Farzandlar yuklashda xatolik');
    }
  };

  const loadHomeworks = async (studentId: string) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{
        success: true;
        data: { homeworks: HomeworkRecord[] };
      }>(`/parent/children/${studentId}/homeworks`);
      setItems(data.data.homeworks ?? []);
    } catch {
      message.error('Uy vazifalarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      void loadHomeworks(selectedChildId);
    }
  }, [selectedChildId]);

  return (
    <Card title="Farzandlar uy vazifalari">
      <Select
        style={{ width: 300, marginBottom: 16 }}
        placeholder="Farzandni tanlang"
        value={selectedChildId ?? undefined}
        onChange={(value) => setSelectedChildId(value)}
        options={children.map((child) => ({
          value: child.studentId?._id ?? child._id,
          label: child.studentId?.fullName ?? "Noma'lum",
        }))}
      />

      <Table
        rowKey="_id"
        columns={[
          { title: 'Uy vazifasi', dataIndex: 'title' as const },
          {
            title: 'Guruh',
            dataIndex: 'groupId' as const,
            render: (v: unknown) => (v as any)?.name ?? '-',
          },
          {
            title: 'Yakunlanish',
            dataIndex: 'dueDate' as const,
            render: (v: unknown) => (v ? dayjs(String(v)).format('DD.MM.YYYY') : '-'),
          },
          {
            title: 'Holat',
            dataIndex: 'status' as const,
            render: (v: string) => {
              const st = STATUS_LABELS[v];
              return st ? <Tag color={st.color}>{st.label}</Tag> : v ?? '-';
            },
          },
        ]}
        dataSource={items}
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: "Uy vazifalari topilmadi" }}
      />
    </Card>
  );
}
