import { useEffect, useState } from 'react';
import { Card, Col, Row, Select, Statistic, Table, Tag, Typography, message } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '../../api/client';

interface StudentBreakdownItem {
  groupId: string;
  groupName: string;
  studentId: string;
  studentName: string;
  studentFee: number;
  totalLessons: number;
  presentCount: number;
  perLessonFee: number;
  contribution: number;
}

interface BonusPenaltyItem {
  _id: string;
  category: 'bonus' | 'penalty';
  amount: number;
  description?: string;
  date?: string;
}

interface TeacherPayrollData {
  baseSalary: number;
  totalBonus: number;
  totalPenalty: number;
  netPayable: number;
  bonusesAndPenalties: BonusPenaltyItem[];
  studentBreakdown: StudentBreakdownItem[];
  month: number;
  year: number;
}

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index,
  label: dayjs().month(index).format('MMMM'),
}));

const yearOptions = Array.from({ length: 5 }, (_, index) => {
  const yearValue = dayjs().year() - 2 + index;
  return { value: yearValue, label: String(yearValue) };
});

function formatMoney(value?: number) {
  return value == null ? '-' : `${Number(value).toLocaleString('ru-RU')} so'm`;
}

export function PayrollPage() {
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [payrollData, setPayrollData] = useState<TeacherPayrollData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: TeacherPayrollData }>(
        `/teacher/payroll?month=${selectedMonth}&year=${selectedYear}`,
      );
      setPayrollData(data.data);
    } catch {
      message.error("Oylik maosh ma'lumotlarini yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPayroll();
  }, [selectedMonth, selectedYear]);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Top Filter Card */}
      <Card title={<span><DollarOutlined style={{ color: '#722ed1', marginRight: 8 }} /> Mening Oylik Maoshim</span>}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={10} md={8}>
            <FormItemLabel label="OYNI TANLANG">
              <Select
                value={selectedMonth}
                onChange={setSelectedMonth}
                options={monthOptions}
                style={{ width: '100%' }}
                size="large"
              />
            </FormItemLabel>
          </Col>
          <Col xs={24} sm={10} md={8}>
            <FormItemLabel label="YILNI TANLANG">
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                options={yearOptions}
                style={{ width: '100%' }}
                size="large"
              />
            </FormItemLabel>
          </Col>
        </Row>
      </Card>

      {/* Overview Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Hisoblangan Baza Oylik"
              value={payrollData?.baseSalary ?? 0}
              formatter={(v) => formatMoney(Number(v))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Rag'batlantirish (+)"
              value={payrollData?.totalBonus ?? 0}
              styles={{ content: { color: '#52c41a' } }}
              formatter={(v) => `+${formatMoney(Number(v))}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Ushlanma / Jarima (-)"
              value={payrollData?.totalPenalty ?? 0}
              styles={{ content: { color: '#ff4d4f' } }}
              formatter={(v) => `-${formatMoney(Number(v))}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: '#f9f0ff', borderColor: '#d3adf7' }}>
            <Statistic
              title="Yakuniy Qo'lga Tegadigan Maosh"
              value={payrollData?.netPayable ?? 0}
              styles={{ content: { color: '#722ed1', fontWeight: 'bold' } }}
              formatter={(v) => formatMoney(Number(v))}
            />
          </Card>
        </Col>
      </Row>

      {/* Student Attendance & Fee Breakdown Table */}
      <Card
        title="O'quvchilar Davomati va Darslar Narxi Kesimida Hisob-Kitob"
        loading={loading}
      >
        <Table
          rowKey={(r) => `${r.groupId}_${r.studentId}`}
          dataSource={payrollData?.studentBreakdown ?? []}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: "Ushbu oy uchun ma'lumotlar topilmadi" }}
          columns={[
            { title: 'Guruh', dataIndex: 'groupName' },
            { title: "O'quvchi F.I.Sh", dataIndex: 'studentName' },
            {
              title: "O'quvchi Oylik Stavkasi",
              dataIndex: 'studentFee',
              render: (v: number) => formatMoney(v),
            },
            { title: 'Darslar Soni', dataIndex: 'totalLessons' },
            {
              title: 'Kelgan Darslari',
              dataIndex: 'presentCount',
              render: (v: number, r: StudentBreakdownItem) => (
                <Tag color={v > 0 ? 'green' : 'red'}>
                  {v} / {r.totalLessons} dars
                </Tag>
              ),
            },
            {
              title: '1 Dars Narxi',
              dataIndex: 'perLessonFee',
              render: (v: number) => formatMoney(v),
            },
            {
              title: "O'qituvchi Hissasi",
              dataIndex: 'contribution',
              render: (v: number) => (
                <Typography.Text strong type="success">
                  +{formatMoney(v)}
                </Typography.Text>
              ),
            },
          ]}
        />
      </Card>

      {/* Bonus / Penalty List */}
      {payrollData?.bonusesAndPenalties && payrollData.bonusesAndPenalties.length > 0 && (
        <Card title="Rag'batlar va Jarimalar Ro'yxati">
          <Table
            rowKey="_id"
            dataSource={payrollData.bonusesAndPenalties}
            pagination={false}
            columns={[
              {
                title: 'Turi',
                dataIndex: 'category',
                render: (v: string) =>
                  v === 'bonus' ? <Tag color="green">Rag'bat (+)</Tag> : <Tag color="red">Jarima (-)</Tag>,
              },
              {
                title: 'Summa',
                dataIndex: 'amount',
                render: (v: number, r: BonusPenaltyItem) =>
                  r.category === 'bonus' ? `+${formatMoney(v)}` : `-${formatMoney(v)}`,
              },
              { title: 'Sababi / Tavsif', dataIndex: 'description' },
              {
                title: 'Sana',
                dataIndex: 'date',
                render: (v: string) => (v ? dayjs(v).format('DD.MM.YYYY') : '-'),
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
}

function FormItemLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>
        {label}
      </Typography.Text>
      {children}
    </div>
  );
}
