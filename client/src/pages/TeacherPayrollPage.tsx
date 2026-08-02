import { useEffect, useState } from 'react';
import { Button, Card, Col, Row, Select, Statistic, Table, Typography, message } from 'antd';
import { ArrowLeftOutlined, CalculatorOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';

interface PayrollRecord {
  _id: string;
  teacherId?: { _id?: string; fullName?: string };
  amount?: number;
  month?: number;
  year?: number;
  description?: string;
  date?: string;
}

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index,
  label: dayjs().month(index).format('MMMM'),
}));

const yearOptions = Array.from({ length: 8 }, (_, index) => {
  const yearValue = dayjs().year() - 2 + index;
  return { value: yearValue, label: String(yearValue) };
});

function formatMoney(value?: number) {
  return value == null ? '-' : `${Number(value).toLocaleString('ru-RU')} so'm`;
}

export function TeacherPayrollPage() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [total, setTotal] = useState(0);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: PayrollRecord[] }>('/superadmin/finance/payroll');
      const payroll = data.data ?? [];
      setRecords(payroll);
      setTotal(payroll.reduce((sum, item) => sum + Number(item.amount ?? 0), 0));
    } catch {
      message.error('O‘qituvchi oyliklarini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPayroll();
  }, []);

  const handleCalculate = async () => {
    try {
      const { data } = await apiClient.post<{ success: true; data: { message?: string } }>('/superadmin/finance/payroll/calculate', {
        month: selectedMonth,
        year: selectedYear,
      });
      message.success(data.data?.message ?? 'Oylik hisoblandi');
      await fetchPayroll();
    } catch (error: any) {
      const description = error?.response?.data?.message || error?.message || 'Oylik hisoblashda xatolik yuz berdi';
      message.error(description);
    }
  };

  const columns = [
    { title: 'O‘qituvchi', dataIndex: 'teacherId', render: (value: { fullName?: string } | undefined) => value?.fullName ?? '-' },
    { title: 'Oy', render: (_value: unknown, record: PayrollRecord) => record.month != null && record.year != null ? `${dayjs().month(record.month).format('MMMM')} ${record.year}` : '-' },
    { title: 'Summa', dataIndex: 'amount', render: (value: number) => formatMoney(value) },
    { title: 'Tavsif', dataIndex: 'description', render: (value: string) => value || '-' },
    { title: 'Sana', dataIndex: 'date', render: (value: string) => value ? dayjs(value).format('DD.MM.YYYY') : '-' },
  ];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <Card>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Typography.Title level={3} style={{ margin: 0 }}>O‘qituvchilar oyligi</Typography.Title>
          </Col>
          <Col>
            <Button icon={<ArrowLeftOutlined />}>
              <Link to="/finance" style={{ color: 'inherit', textDecoration: 'none' }}>Moliya</Link>
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic title="Jami oylik" value={total} formatter={(value) => formatMoney(Number(value))} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Hisoblangan yozuvlar" value={records.length} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Tanlangan oy" value={`${dayjs().month(selectedMonth).format('MMMM')} ${selectedYear}`} />
          </Card>
        </Col>
      </Row>

      <Card title="Oylik hisoblash">
        <Row gutter={16} align="middle">
          <Col xs={24} md={8}>
            <Select value={selectedMonth} onChange={setSelectedMonth} options={monthOptions} style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={8}>
            <Select value={selectedYear} onChange={setSelectedYear} options={yearOptions} style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={8}>
            <Button type="primary" icon={<CalculatorOutlined />} block onClick={() => void handleCalculate()} loading={loading}>
              Oylik hisoblash
            </Button>
          </Col>
        </Row>
      </Card>

      <Card title="Hisoblangan oyliklar">
        <Table rowKey="_id" dataSource={records} columns={columns} loading={loading} pagination={{ pageSize: 8 }} locale={{ emptyText: 'Hech narsa yo‘q' }} />
      </Card>
    </div>
  );
}
