import { useEffect, useState } from 'react';
import { Card, Table, Select, message } from 'antd';
import { apiClient } from '../../api/client';

interface ChildRecord {
  _id: string;
  studentId?: { _id?: string; fullName?: string };
}

interface ParentGradeRecord {
  _id: string;
  title?: string;
  score?: number;
  maxScore?: number;
  type: 'homework' | 'quiz';
}

export function GradesPage() {
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [items, setItems] = useState<ParentGradeRecord[]>([]);
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

  const loadGrades = async (childId: string) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: { homeworkSubmissions: any[]; quizAttempts: any[] } }>(`/parent/children/${childId}/grades`);
      setItems([
        ...(data.data.homeworkSubmissions?.map((submission) => ({
          _id: submission._id,
          title: submission.homeworkId?.title,
          score: submission.score,
          maxScore: submission.homeworkId?.maxScore,
          type: 'homework' as const,
        })) ?? []),
        ...(data.data.quizAttempts?.map((attempt) => ({
          _id: attempt._id,
          title: attempt.quizId?.title,
          score: attempt.score,
          maxScore: attempt.maxScore,
          type: 'quiz' as const,
        })) ?? []),
      ]);
    } catch {
      message.error('Baholarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      void loadGrades(selectedChildId);
    }
  }, [selectedChildId]);

  return (
    <Card title="Farzandlar baholari">
      <Select
        style={{ width: 300, marginBottom: 16 }}
        value={selectedChildId ?? undefined}
        onChange={(value) => setSelectedChildId(value)}
        options={children.map((child) => ({ value: child._id, label: child.studentId?.fullName ?? 'Noma’lum' }))}
      />

      <Table
        rowKey="_id"
        columns={[
          { title: 'Nomi', dataIndex: 'title' as const },
          { title: 'Tur', dataIndex: 'type' as const },
          { title: 'Ball', dataIndex: 'score' as const },
          { title: 'Maks', dataIndex: 'maxScore' as const },
        ]}
        dataSource={items}
        loading={loading}
        pagination={false}
      />
    </Card>
  );
}
