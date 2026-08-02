import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '../api/client';

interface FinanceRecord {
  _id: string;
  name: string;
  kind?: 'expense' | 'income';
  category?: string;
  amount?: number;
  date?: string;
  description?: string;
  teacherId?: { _id?: string; fullName?: string };
  studentId?: { _id?: string; fullName?: string };
  groupId?: { _id?: string; name?: string };
  month?: number;
  year?: number;
  reference?: string;
}

interface FinanceSummary {
  income: number;
  expense: number;
  balance: number;
}

const kindOptions = [
  { value: 'income', label: 'Tushum' },
  { value: 'expense', label: 'Xarajat' },
];

const categoryOptions = [
  { value: 'manual', label: 'Qo‘lda kiritish' },
  { value: 'income', label: 'Tushum' },
  { value: 'expense', label: 'Xarajat' },
  { value: 'teacher_salary', label: 'O‘qituvchi oyligi' },
  { value: 'bonus', label: 'Rag‘bat' },
  { value: 'penalty', label: 'Jarima' },
  { value: 'other', label: 'Boshqa' },
];

const monthOptions = Array.from({ length: 12 }, (_, index) => ({ value: index, label: dayjs().month(index).format('MMMM') }));

function formatMoney(value?: number) {
  return value == null ? '-' : `${Number(value).toLocaleString('ru-RU')} so'm`;
}

export function FinancePage() {
  const [form] = Form.useForm();
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [payroll, setPayroll] = useState<FinanceRecord[]>([]);
  const [summary, setSummary] = useState<FinanceSummary>({ income: 0, expense: 0, balance: 0 });
  const [loading, setLoading] = useState(false);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
  const [selectedYear, setSelectedYear] = useState(dayjs().year());

  const fetchSummary = async () => {
    try {
      const { data } = await apiClient.get<{ success: true; data: FinanceSummary }>('/superadmin/finance/summary');
      setSummary(data.data ?? { income: 0, expense: 0, balance: 0 });
    } catch {
      message.error('Moliya balansini yuklashda xatolik yuz berdi');
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: FinanceRecord[] }>('/superadmin/finance');
      setRecords(data.data ?? []);
    } catch {
      message.error('Moliya yozuvlarini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const loadPayroll = async () => {
    setPayrollLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: FinanceRecord[] }>('/superadmin/finance/payroll');
      setPayroll(data.data ?? []);
    } catch {
      message.error('O‘qituvchi oyliklarini yuklashda xatolik yuz berdi');
    } finally {
      setPayrollLoading(false);
    }
  };

  useEffect(() => {
    void fetchSummary();
    void loadRecords();
    void loadPayroll();
  }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        kind: values.kind,
        category: values.category ?? (values.kind === 'income' ? 'income' : 'expense'),
        amount: Number(values.amount ?? 0),
        date: dayjs(values.date ?? new Date()).toISOString(),
        description: values.description ?? '',
        reference: values.reference ?? '',
        teacherId: values.teacherId ?? '',
        studentId: values.studentId ?? '',
        groupId: values.groupId ?? '',
      };

      await apiClient.post('/superadmin/finance', payload);
      form.resetFields();
      setOpen(false);
      message.success('Moliya yozuvi saqlandi');
      await fetchSummary();
      await loadRecords();
    } catch (error: any) {
      const description = error?.response?.data?.message || error?.message || 'Yozuvni saqlashda xatolik yuz berdi';
      message.error(description);
    }
  };

  const handleCalculatePayroll = async () => {
    try {
      const { data } = await apiClient.post<{ success: true; data: { message?: string; records?: FinanceRecord[] } }>('/superadmin/finance/payroll/calculate', {
        month: selectedMonth,
        year: selectedYear,
      });
      message.success(data.data?.message ?? 'Oylik hisoblandi');
      await fetchSummary();
      await loadRecords();
      await loadPayroll();
    } catch (error: any) {
      const description = error?.response?.data?.message || error?.message || 'Oylik hisoblashda xatolik yuz berdi';
      message.error(description);
    }
  };

  const financeColumns = [
    { title: 'Sarlavha', dataIndex: 'name' },
    { title: 'Turi', dataIndex: 'kind', render: (value: string) => value === 'income' ? 'Tushum' : 'Xarajat' },
    { title: 'Kategoriya', dataIndex: 'category', render: (value: string) => categoryOptions.find((item) => item.value === value)?.label ?? value ?? '-' },
    { title: 'Summa', dataIndex: 'amount', render: (value: number) => formatMoney(value) },
    { title: 'Sana', dataIndex: 'date', render: (value: string) => value ? dayjs(value).format('DD.MM.YYYY') : '-' },
    { title: 'Tavsif', dataIndex: 'description', render: (value: string) => value || '-' },
    { title: 'O‘qituvchi', dataIndex: 'teacherId', render: (value: { fullName?: string }) => value?.fullName ?? '-' },
  ];

  const payrollColumns = [
    { title: 'O‘qituvchi', dataIndex: 'teacherId', render: (value: { fullName?: string }) => value?.fullName ?? '-' },
    { title: 'Oy', render: (_value: unknown, record: FinanceRecord) => record.month != null && record.year != null ? `${dayjs().month(record.month).format('MMMM')} ${record.year}` : '-' },
    { title: 'Summa', dataIndex: 'amount', render: (value: number) => formatMoney(value) },
    { title: 'Tavsif', dataIndex: 'description', render: (value: string) => value || '-' },
  ];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <Card>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Typography.Title level={3} style={{ margin: 0 }}>Moliya</Typography.Title>
          </Col>
          <Col>
            <Space>
              <Button type="primary" onClick={() => setOpen(true)}>Yangi yozuv</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic title="Tushum" value={summary.income} formatter={(value) => formatMoney(Number(value))} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Xarajat" value={summary.expense} formatter={(value) => formatMoney(Number(value))} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Qoldiq" value={summary.balance} formatter={(value) => formatMoney(Number(value))} valueStyle={{ color: summary.balance >= 0 ? '#1890ff' : '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      <Card title="O‘qituvchi oyligi hisoblash">
        <Row gutter={16} align="middle">
          <Col xs={24} md={8}>
            <Select value={selectedMonth} onChange={setSelectedMonth} options={monthOptions} style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={8}>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              options={Array.from({ length: 8 }, (_, index) => {
                const yearValue = dayjs().year() - 2 + index;
                return { value: yearValue, label: String(yearValue) };
              })}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={8}>
            <Button type="primary" block onClick={() => void handleCalculatePayroll()} loading={payrollLoading}>Oylik hisoblash</Button>
          </Col>
        </Row>
        <div style={{ marginTop: 16 }}>
          <Table rowKey="_id" dataSource={payroll} columns={payrollColumns} pagination={{ pageSize: 8 }} loading={payrollLoading} locale={{ emptyText: 'Hech narsa yo‘q' }} />
        </div>
      </Card>

      <Card title="Moliya yozuvlari">
        <Table rowKey="_id" dataSource={records} columns={financeColumns} loading={loading} pagination={{ pageSize: 8 }} locale={{ emptyText: 'No data' }} />
      </Card>

      <Modal
        title="Yangi moliya yozuvi"
        open={open}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        onOk={handleSubmit}
        okText="Saqlash"
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Sarlavha" rules={[{ required: true, message: 'Sarlavha kiriting' }]}> 
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="kind" label="Turi" rules={[{ required: true, message: 'Turi tanlang' }]} initialValue="income">
                <Select options={kindOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Kategoriya" initialValue="manual">
                <Select options={categoryOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label="Summa" rules={[{ required: true, message: 'Summa kiriting' }]}> 
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="Sana" rules={[{ required: true, message: 'Sana kiriting' }]}> 
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reference" label="Ma'lumot manbai">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Tavsif">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
