import { useEffect, useState } from 'react';
import { Card, Table } from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '../api/client';

interface AuditLogRecord {
  _id: string;
  action?: string;
  entityType?: string;
  createdAt?: string;
  userId?: { fullName?: string };
  meta?: unknown;
}

const columns = [
  { title: 'Foydalanuvchi', dataIndex: 'userId', render: (value: unknown) => (value as any)?.fullName ?? '-' },
  { title: 'Harakat', dataIndex: 'action' },
  { title: 'Obyekt', dataIndex: 'entityType' },
  { title: 'Vaqt', dataIndex: 'createdAt', render: (value: unknown) => value ? dayjs(String(value)).format('DD.MM.YYYY HH:mm') : '-' },
  { title: 'Meta', dataIndex: 'meta', render: (value: unknown) => value ? JSON.stringify(value) : '-' },
];

export function AuditLogsPage() {
  const [items, setItems] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get<{ success: true; data: AuditLogRecord[] }>('/superadmin/audit-logs');
        setItems(data.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Card title="Audit log">
      <Table rowKey="_id" columns={columns} dataSource={items} loading={loading} />
    </Card>
  );
}
