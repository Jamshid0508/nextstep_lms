import { useEffect, useState } from 'react';
import { Card, List, Button, message } from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '../../api/client';

interface QuizRecord {
  _id: string;
  title?: string;
  groupId?: { name?: string };
  availableFrom?: string;
  availableTo?: string;
  status?: string;
}

export function QuizzesPage() {
  const [items, setItems] = useState<QuizRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: QuizRecord[] }>('/student/quizzes');
      setItems(data.data);
    } catch {
      message.error('Testlar yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const startQuiz = async (id: string) => {
    try {
      await apiClient.post(`/student/quizzes/${id}/start`);
      message.success('Test boshlash so‘rovi yuborildi');
    } catch {
      message.error('Testni boshlashda xatolik yuz berdi');
    }
  };

  return (
    <Card title="Testlar">
      <List
        loading={loading}
        dataSource={items}
        renderItem={(item) => (
          <List.Item actions={[<Button type="link" onClick={() => void startQuiz(item._id)}>Boshlash</Button>]}> 
            <List.Item.Meta
              title={item.title}
              description={`Guruh: ${(item.groupId as any)?.name ?? '-'} | Mavjud: ${item.availableFrom ? dayjs(String(item.availableFrom)).format('DD.MM.YYYY') : '-'} - ${item.availableTo ? dayjs(String(item.availableTo)).format('DD.MM.YYYY') : '-'} | Holat: ${item.status ?? '-'}`}
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
