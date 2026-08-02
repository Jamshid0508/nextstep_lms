import { useEffect, useState } from 'react';
import { Card, Table, Select, Tag, message } from 'antd';
import { apiClient } from '../../api/client';

interface ChildRecord {
  _id: string;
  studentId?: { _id?: string; fullName?: string };
  relationship?: string;
}

interface GradeItem {
  _id: string;
  title?: string;
  score?: number;
  maxScore?: number;
  type: 'homework' | 'quiz';
}

export function GradesPage() {
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [items, setItems] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadChildren = async () => {
    try {
      const { data } = await apiClient.get<{ success: true; data: ChildRecord[] }>('/parent/children');
      setChildren(data.data);
      if (data.data.length > 0 && !selectedChildId) {
        const firstStudentId = data.data[0].studentId?._id;
        if (firstStudentId) setSelectedChildId(firstStudentId);
      }
    } catch {
      message.error('Farzandlar yuklashda xatolik');
    }
  };

  const loadGrades = async (studentId: string) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{
        success: true;
        data: { homeworkSubmissions: any[]; quizAttempts: any[] };
      }>(`/parent/children/${studentId}/grades`);
      setItems([
        ...(data.data.homeworkSubmissions?.map((s) => ({
          _id: s._id,
          title: s.homeworkId?.title,
          score: s.score,
          maxScore: s.homeworkId?.maxScore,
          type: 'homework' as const,
        })) ?? []),
        ...(data.data.quizAttempts?.map((a) => ({
          _id: a._id,
          title: a.quizId?.title,
          score: a.score,
          maxScore: a.maxScore,
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
    if (selectedChildId) void loadGrades(selectedChildId);
  }, [selectedChildId]);

  return (
    <Card title="Farzandlar baholari">
      <Select
        style={{ width: 300, marginBottom: 16 }}
        placeholder="Farzandni tanlang"
        value={selectedChildId ?? undefined}
        onChange={(value) => setSelectedChildId(value)}
        options={children.map((child) => ({
          value: child.studentId?._id ?? child._id,
          label: child.studentId?.fullName ?? "Noma'lum",
        }))}
      />

      <Table
        rowKey="_id"
        columns={[
          { title: 'Nomi', dataIndex: 'title' as const },
          {
            title: 'Tur',
            dataIndex: 'type' as const,
            render: (v: string) =>
              v === 'homework' ? <Tag color="blue">Uy vazifasi</Tag> : <Tag color="purple">Test</Tag>,
          },
          { title: 'Ball', dataIndex: 'score' as const },
          { title: 'Maksimal', dataIndex: 'maxScore' as const },
        ]}
        dataSource={items}
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: 'Baholar topilmadi' }}
      />
    </Card>
  );
}
