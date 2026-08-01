import { useEffect, useState } from 'react';
import { Card, Table, Select, message } from 'antd';
import { apiClient } from '../../api/client';

interface ChildRecord {
  _id: string;
  studentId?: { _id?: string; fullName?: string };
}

interface ParentHomeworkRecord {
  _id: string;
  homeworkId?: { title?: string };
  dueDate?: string;
  status?: string;
}

export function HomeworksPage() {
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [items, setItems] = useState<ParentHomeworkRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadChildren = async () => {
    try {
      const { data } = await apiClient.get<{ success: true; data: ChildRecord[] }>('/parent/children');
      setChildren(data.data);
      if (data.data.length > 0 && !selectedChildId) {
        setSelectedChildId(data.data[0]._id);
      }
    } catch {
      message.error('Farzandlar yuklashda xatolik');
    }
  };

  const loadHomeworks = async (childId: string) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: { homeworks: ParentHomeworkRecord[] } }>(`/parent/children/${childId}/homeworks`);
      setItems(data.data.homeworks);
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
        value={selectedChildId ?? undefined}
        onChange={(value) => setSelectedChildId(value)}
        options={children.map((child) => ({ value: child._id, label: child.studentId?.fullName ?? 'Noma’lum' }))}
      />

      <Table
        rowKey="_id"
        columns={[
          { title: 'Uy vazifa', dataIndex: 'homeworkId', render: (value: unknown) => (value as any)?.title ?? '-' },
          { title: 'Yakunlanish', dataIndex: 'dueDate' as const },
          { title: 'Holat', dataIndex: 'status' as const },
        ]}
        dataSource={items}
        loading={loading}
        pagination={false}
      />
    </Card>
  );
}
