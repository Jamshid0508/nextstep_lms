import { useEffect, useState } from 'react';
import { Card, Table } from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '../../api/client';

interface ScheduleRecord {
  _id: string;
  groupId?: { name?: string };
  lessonDate?: string;
  startTime?: string;
  endTime?: string;
}

export function SchedulesPage() {
  const [items, setItems] = useState<ScheduleRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get<{ success: true; data: ScheduleRecord[] }>('/student/schedules');
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
    { title: 'Boshlanish', dataIndex: 'startTime' },
    { title: 'Tugash', dataIndex: 'endTime' },
  ];

  return (
    <Card title="Jadval">
      <Table rowKey="_id" columns={columns} dataSource={items} loading={loading} pagination={false} />
    </Card>
  );
}
