import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { AuditOutlined, BookOutlined, CheckSquareOutlined, DollarOutlined, SolutionOutlined, TeamOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface DashboardSummary {
  studentsCount?: number;
  teachersCount?: number;
  activeGroupsCount?: number;
  overduePaymentsCount?: number;
  groupsCount?: number;
  homeworksCount?: number;
  quizzesCount?: number;
  pendingSubmissions?: number;
  childrenCount?: number;
  paymentsCount?: number;
  unreadNotificationsCount?: number;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const role = user?.role;

  useEffect(() => {
    if (!role) return;

    let endpoint = '/superadmin/dashboard/summary';
    if (role === 'STUDENT') endpoint = '/student/dashboard';
    if (role === 'TEACHER') endpoint = '/teacher/dashboard';
    if (role === 'PARENT') endpoint = '/parent/dashboard';

    apiClient
      .get<{ success: true; data: DashboardSummary }>(endpoint)
      .then(({ data }) => setSummary(data.data))
      .catch(() => setSummary(null));
  }, [role]);

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Xush kelibsiz, {user?.fullName}</h2>

      {role === 'SUPER_ADMIN' || role === 'ADMIN' ? (
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic title="Talabalar" value={summary?.studentsCount ?? 0} prefix={<UserOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="O'qituvchilar" value={summary?.teachersCount ?? 0} prefix={<TeamOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Faol guruhlar" value={summary?.activeGroupsCount ?? 0} prefix={<BookOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Muddati o'tgan to'lovlar"
                value={summary?.overduePaymentsCount ?? 0}
                prefix={<DollarOutlined />}
                styles={{ content: { color: (summary?.overduePaymentsCount ?? 0) > 0 ? '#ff4d4f' : undefined } }}
              />
            </Card>
          </Col>
        </Row>
      ) : role === 'TEACHER' ? (
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic title="Guruhlar" value={summary?.groupsCount ?? 0} prefix={<BookOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Uy vazifalar" value={summary?.homeworksCount ?? 0} prefix={<FileTextOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Testlar" value={summary?.quizzesCount ?? 0} prefix={<SolutionOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Topshirilgan topshiriqlar" value={summary?.pendingSubmissions ?? 0} prefix={<CheckSquareOutlined />} />
            </Card>
          </Col>
        </Row>
      ) : role === 'STUDENT' ? (
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic title="Guruhlar" value={summary?.groupsCount ?? 0} prefix={<BookOutlined />} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="Uy vazifalar" value={summary?.homeworksCount ?? 0} prefix={<FileTextOutlined />} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="Testlar" value={summary?.quizzesCount ?? 0} prefix={<SolutionOutlined />} />
            </Card>
          </Col>
        </Row>
      ) : role === 'PARENT' ? (
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic title="Farzandlar" value={summary?.childrenCount ?? 0} prefix={<TeamOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Uy vazifalar" value={summary?.homeworksCount ?? 0} prefix={<FileTextOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="To‘lovlar" value={summary?.paymentsCount ?? 0} prefix={<DollarOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="O‘qilmagan bildirishnomalar" value={summary?.unreadNotificationsCount ?? 0} prefix={<AuditOutlined />} />
            </Card>
          </Col>
        </Row>
      ) : null}
    </div>
  );
}
