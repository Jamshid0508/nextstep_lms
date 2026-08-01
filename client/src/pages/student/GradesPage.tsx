import { useEffect, useState } from 'react';
import { Card, Table } from 'antd';
import { apiClient } from '../../api/client';

interface GradeRecord {
  _id: string;
  title?: string;
  score?: number;
  maxScore?: number;
  type: 'homework' | 'quiz';
}

export function GradesPage() {
  const [items, setItems] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get<{ success: true; data: { homeworkSubmissions: any[]; quizAttempts: any[] } }>('/student/grades');
        setItems([
          ...(data.data.homeworkSubmissions.map((submission) => ({
            _id: submission._id,
            title: submission.homeworkId?.title,
            score: submission.score,
            maxScore: submission.homeworkId?.maxScore,
            type: 'homework' as const,
          })) || []),
          ...(data.data.quizAttempts.map((attempt) => ({
            _id: attempt._id,
            title: attempt.quizId?.title,
            score: attempt.score,
            maxScore: attempt.maxScore,
            type: 'quiz' as const,
          })) || []),
        ]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const columns = [
    { title: 'Nomi', dataIndex: 'title' as const },
    { title: 'Tur', dataIndex: 'type' as const },
    { title: 'Ball', dataIndex: 'score' as const },
    { title: 'Maks', dataIndex: 'maxScore' as const },
  ];

  return (
    <Card title="Baholarim">
      <Table rowKey="_id" columns={columns} dataSource={items} loading={loading} pagination={false} />
    </Card>
  );
}
