import { useEffect, useState } from 'react';
import { Card, Table } from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '../../api/client';

interface AttendanceRecord {
  _id: string;
  groupId?: { name?: string };
  lessonDate?: string;
  status?: string;
}

export function AttendancePage() {
  const [items, setItems] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get<{ success: true; data: AttendanceRecord[] }>('/student/attendance');
        setItems(data.data);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const columns = [
    { title: 'Guruh', dataIndex: 'groupId', render: (value: unknown) => (value as any)?.name ?? '-' },
    { title: 'Sana', dataIndex: 'lessonDate', render: (value: unknown) => (value ? dayjs(String(value)).format('DD.MM.YYYY') : '-') },
    { title: 'Holat', dataIndex: 'status' as const },
  ];

  return (
    <Card title="Davomatim">
      <Table rowKey="_id" columns={columns} dataSource={items} loading={loading} pagination={false} />
    </Card>
  );
}
