import { Card, Collapse, Table } from 'antd';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { apiClient } from '../api/client';

interface HomeworkSubmission {
  _id: string;
  homeworkId?: { title?: string; maxScore?: number };
  studentId?: { fullName?: string };
  gradedBy?: { fullName?: string };
  score?: number;
  feedback?: string;
  submittedAt?: string;
  gradedAt?: string;
}

interface QuizAttempt {
  _id: string;
  quizId?: { title?: string; maxScore?: number };
  studentId?: { fullName?: string };
  score?: number;
  submittedAt?: string;
}

interface GradesResponse {
  homeworkSubmissions: HomeworkSubmission[];
  quizAttempts: QuizAttempt[];
}

const homeworkColumns = [
  { title: 'Talaba', dataIndex: 'studentId', render: (value: unknown) => (value as any)?.fullName ?? '-' },
  { title: 'Uy vazifasi', dataIndex: 'homeworkId', render: (value: unknown) => (value as any)?.title ?? '-' },
  { title: 'Ball', dataIndex: 'score' },
  { title: 'Maksimal ball', dataIndex: 'homeworkId', render: (value: unknown) => (value as any)?.maxScore ?? '-' },
  { title: 'Baholagan', dataIndex: 'gradedBy', render: (value: unknown) => (value as any)?.fullName ?? '-' },
  { title: 'Topshirish', dataIndex: 'submittedAt', render: (value: unknown) => value ? dayjs(String(value)).format('DD.MM.YYYY') : '-' },
];

const quizColumns = [
  { title: 'Talaba', dataIndex: 'studentId', render: (value: unknown) => (value as any)?.fullName ?? '-' },
  { title: 'Test', dataIndex: 'quizId', render: (value: unknown) => (value as any)?.title ?? '-' },
  { title: 'Ball', dataIndex: 'score' },
  { title: 'Maksimal ball', dataIndex: 'quizId', render: (value: unknown) => (value as any)?.maxScore ?? '-' },
  { title: 'Topshirish', dataIndex: 'submittedAt', render: (value: unknown) => value ? dayjs(String(value)).format('DD.MM.YYYY') : '-' },
];

export function GradesPage() {
  const [homeworkSubmissions, setHomeworkSubmissions] = useState<HomeworkSubmission[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadGrades = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get<{ success: true; data: GradesResponse }>('/superadmin/grades');
        setHomeworkSubmissions(data.data.homeworkSubmissions ?? []);
        setQuizAttempts(data.data.quizAttempts ?? []);
      } finally {
        setLoading(false);
      }
    };

    void loadGrades();
  }, []);

  return (
    <Card title="Baholar">
      <Collapse defaultActiveKey={['homework', 'quiz']}>
        <Collapse.Panel key="homework" header="Uy vazifalari baholari">
          <Table rowKey="_id" columns={homeworkColumns} dataSource={homeworkSubmissions} loading={loading} />
        </Collapse.Panel>
        <Collapse.Panel key="quiz" header="Test baholari">
          <Table rowKey="_id" columns={quizColumns} dataSource={quizAttempts} loading={loading} />
        </Collapse.Panel>
      </Collapse>
    </Card>
  );
}
