import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Progress } from 'antd';
import { AuditOutlined, BookOutlined, CheckSquareOutlined, DollarOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface BranchStat {
  branchId: string;
  branchName: string;
  studentCount: number;
  activeGroupsCount: number;
  totalPaymentsAmount: number;
  overduePaymentsCount: number;
  attendancePresent: number;
  attendanceAbsent: number;
  attendanceLate: number;
  attendanceExcused: number;
  attendancePercent: number;
}

interface DashboardSummary {
  studentsCount?: number;
  teachersCount?: number;
  activeGroupsCount?: number;
  overduePaymentsCount?: number;
  totalIncome?: number;
  totalExpense?: number;
  financeBalance?: number;
  attendanceTotal?: number;
  attendancePresent?: number;
  attendanceAbsent?: number;
  attendanceLate?: number;
  attendanceExcused?: number;
  attendancePercent?: number;
  branchStats?: BranchStat[];
  groupsCount?: number;
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

  const branchColumns = [
    { title: 'Filial', dataIndex: 'branchName', key: 'branchName' },
    { title: 'Talabalar', dataIndex: 'studentCount', key: 'studentCount' },
    { title: 'Faol guruhlar', dataIndex: 'activeGroupsCount', key: 'activeGroupsCount' },
    {
      title: 'To‘lovlar jami',
      dataIndex: 'totalPaymentsAmount',
      key: 'totalPaymentsAmount',
      render: (value: number) => new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' }).format(value),
    },
    { title: 'Kechiktirilgan to‘lovlar', dataIndex: 'overduePaymentsCount', key: 'overduePaymentsCount' },
    {
      title: 'Davomat',
      dataIndex: 'attendancePercent',
      key: 'attendancePercent',
      render: (value: number) => <Progress percent={Math.round(value)} size="small" />,
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Xush kelibsiz, {user?.fullName}</h2>

      {role === 'SUPER_ADMIN' || role === 'ADMIN' ? (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
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

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Daromad"
                  value={summary?.totalIncome ?? 0}
                  prefix={<DollarOutlined />}
                  formatter={(value) => new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' }).format(Number(value))}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Xarajat"
                  value={summary?.totalExpense ?? 0}
                  prefix={<DollarOutlined />}
                  formatter={(value) => new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' }).format(Number(value))}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Moliya balans"
                  value={summary?.financeBalance ?? 0}
                  prefix={<DollarOutlined />}
                  formatter={(value) => new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' }).format(Number(value))}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="O'rtacha davomat"
                  value={summary?.attendancePercent ? `${Math.round(summary.attendancePercent)}%` : '0%'}
                  prefix={<CheckSquareOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Filiallar bo‘yicha statistikalar" style={{ marginBottom: 24 }}>
            <Table
              dataSource={summary?.branchStats ?? []}
              columns={branchColumns}
              rowKey="branchId"
              pagination={false}
            />
          </Card>
        </>
      ) : role === 'TEACHER' ? (
        <Row gutter={16}>
          <Col span={12}>
            <Card>
              <Statistic title="Guruhlarim" value={summary?.groupsCount ?? 0} prefix={<BookOutlined />} />
            </Card>
          </Col>
        </Row>
      ) : role === 'STUDENT' ? (
        <Row gutter={16}>
          <Col span={12}>
            <Card>
              <Statistic title="Guruhlarim" value={summary?.groupsCount ?? 0} prefix={<BookOutlined />} />
            </Card>
          </Col>
        </Row>
      ) : role === 'PARENT' ? (
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic title="Farzandlar" value={summary?.childrenCount ?? 0} prefix={<TeamOutlined />} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="To‘lovlar" value={summary?.paymentsCount ?? 0} prefix={<DollarOutlined />} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="O‘qilmagan bildirishnomalar" value={summary?.unreadNotificationsCount ?? 0} prefix={<AuditOutlined />} />
            </Card>
          </Col>
        </Row>
      ) : null}
    </div>
  );
}
