import { useEffect, useState } from 'react';
import { Card, List, Button, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '../../api/client';

interface QuizRecord {
  _id: string;
  title?: string;
  groupId?: { name?: string };
  availableFrom?: string;
  availableTo?: string;
  attemptsAllowed?: number;
  status?: string;
}

const QUIZ_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Qoralama', color: 'default' },
  published: { label: 'Nashr qilingan', color: 'green' },
  closed: { label: 'Yakunlangan', color: 'red' },
};

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
      message.success("Test muvaffaqiyatli boshlandi");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Testni boshlashda xatolik yuz berdi';
      message.error(msg);
    }
  };

  return (
    <Card title="Testlar">
      <List
        loading={loading}
        dataSource={items}
        locale={{ emptyText: 'Mavjud testlar topilmadi' }}
        renderItem={(item) => {
          const st = item.status ? QUIZ_STATUS_LABELS[item.status] : null;
          return (
            <List.Item actions={[<Button type="primary" size="small" onClick={() => void startQuiz(item._id)}>Boshlash</Button>]}>
              <List.Item.Meta
                title={<span>{item.title} {st && <Tag color={st.color}>{st.label}</Tag>}</span>}
                description={`Guruh: ${(item.groupId as any)?.name ?? '-'} | Mavjud: ${
                  item.availableFrom ? dayjs(String(item.availableFrom)).format('DD.MM.YYYY') : '-'
                } – ${
                  item.availableTo ? dayjs(String(item.availableTo)).format('DD.MM.YYYY') : '-'
                } | Urinishlar: ${item.attemptsAllowed ?? 1} ta`}
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );
}
