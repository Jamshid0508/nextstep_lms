import { useEffect, useState } from 'react';
import { List, Card, Button } from 'antd';
import { apiClient } from '../../api/client';

interface NotificationRecord {
  _id: string;
  title?: string;
  message?: string;
  isRead?: boolean;
}

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: NotificationRecord[] }>('/parent/notifications');
      setItems(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleMarkRead = async (id: string) => {
    await apiClient.patch(`/parent/notifications/${id}/read`);
    void load();
  };

  return (
    <Card title="Bildirishnomalar">
      <List
        loading={loading}
        dataSource={items}
        renderItem={(item) => (
          <List.Item
            actions={item.isRead ? [] : [<Button type="link" onClick={() => void handleMarkRead(item._id)}>Belgilash</Button>]}
          >
            <List.Item.Meta
              title={item.title}
              description={item.message}
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
