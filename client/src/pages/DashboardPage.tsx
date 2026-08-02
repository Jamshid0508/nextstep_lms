import { useEffect, useState } from 'react';
import { Button, Card, Col, Progress, Row, Space, Statistic, Table, Typography } from 'antd';
import {
  AuditOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  DollarOutlined,
  RightOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
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
  schedulesCount?: number;
  attendanceCount?: number;
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
    <div style={{ display: 'grid', gap: 20 }}>
      <Typography.Title level={2} style={{ margin: 0 }}>
        Xush kelibsiz, {user?.fullName}
      </Typography.Title>

      {role === 'SUPER_ADMIN' || role === 'ADMIN' ? (
        <>
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

          <Row gutter={16}>
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

          <Card title="Filiallar bo‘yicha statistikalar">
            <Table
              dataSource={summary?.branchStats ?? []}
              columns={branchColumns}
              rowKey="branchId"
              pagination={false}
            />
          </Card>
        </>
      ) : role === 'TEACHER' ? (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card hoverable style={{ borderRadius: 16 }}>
                <Statistic
                  title="Mening Guruhlarim"
                  value={summary?.groupsCount ?? 0}
                  prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
                />
                <div style={{ marginTop: 12 }}>
                  <Link to="/teacher/groups">
                    <Button type="link" padding-0 size="small">
                      Guruhlarni ko'rish <RightOutlined />
                    </Button>
                  </Link>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card hoverable style={{ borderRadius: 16 }}>
                <Statistic
                  title="Dars Jadvallarim"
                  value={summary?.schedulesCount ?? 0}
                  prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
                />
                <div style={{ marginTop: 12 }}>
                  <Link to="/teacher/schedules">
                    <Button type="link" size="small">
                      Jadvalni ko'rish <RightOutlined />
                    </Button>
                  </Link>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card hoverable style={{ borderRadius: 16, background: '#f9f0ff', borderColor: '#722ed1' }}>
                <Statistic
                  title="Davomat / Yo'qlama"
                  value={summary?.attendanceCount ?? 0}
                  prefix={<CheckSquareOutlined style={{ color: '#52c41a' }} />}
                />
                <div style={{ marginTop: 12 }}>
                  <Link to="/teacher/attendance">
                    <Button type="primary" size="small" style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}>
                      Yo'qlama qilish <RightOutlined />
                    </Button>
                  </Link>
                </div>
              </Card>
            </Col>
          </Row>

          <Card title="Tezkor harakatlar" style={{ borderRadius: 16 }}>
            <Space wrap size="middle">
              <Link to="/teacher/attendance">
                <Button type="primary" size="large" icon={<CheckSquareOutlined />} style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', borderRadius: 8 }}>
                  Bugungi Yo'qlamani Olish
                </Button>
              </Link>
              <Link to="/teacher/groups">
                <Button size="large" icon={<TeamOutlined />} style={{ borderRadius: 8 }}>
                  Guruhlarimni Ko'rish
                </Button>
              </Link>
              <Link to="/teacher/payroll">
                <Button size="large" icon={<DollarOutlined />} style={{ borderRadius: 8 }}>
                  Oylik Maoshimni Ko'rish
                </Button>
              </Link>
            </Space>
          </Card>
        </>
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
