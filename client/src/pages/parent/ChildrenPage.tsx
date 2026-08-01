import { useEffect, useState } from 'react';
import { Card, Table } from 'antd';
import { apiClient } from '../../api/client';

interface ChildRecord {
  _id: string;
  studentId?: { fullName?: string };
}

export function ChildrenPage() {
  const [items, setItems] = useState<ChildRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get<{ success: true; data: ChildRecord[] }>('/parent/children');
        setItems(data.data);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <Card title="Farzandlarim">
      <Table rowKey="_id" columns={[
        { title: 'Ism', dataIndex: 'studentId', render: (value: unknown) => (value as any)?.fullName ?? '-' },
      ]} dataSource={items} loading={loading} pagination={false} />
    </Card>
  );
}
