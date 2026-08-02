import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  PlusOutlined,
  CalculatorOutlined,
  EyeOutlined,
  DeleteOutlined,
  DollarOutlined,
  ShoppingOutlined,
  UserOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
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
  recipient?: string;
  itemsReceived?: string;
  teacherId?: { _id?: string; fullName?: string };
  studentId?: { _id?: string; fullName?: string };
  groupId?: { _id?: string; name?: string };
  month?: number;
  year?: number;
  reference?: string;
}

interface TeacherUser {
  _id: string;
  fullName: string;
  phone?: string;
}

interface FinanceSummary {
  income: number;
  expense: number;
  balance: number;
}

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

interface PayrollBreakdownData {
  teacher?: { _id: string; fullName: string; phone?: string; email?: string };
  month: number;
  year: number;
  baseSalary: number;
  totalBonus: number;
  totalPenalty: number;
  netPayable: number;
  studentBreakdown: StudentBreakdownItem[];
  bonusesAndPenalties: FinanceRecord[];
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

export function FinancePage() {
  const [activeTab, setActiveTab] = useState('income');

  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [payroll, setPayroll] = useState<FinanceRecord[]>([]);
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [summary, setSummary] = useState<FinanceSummary>({ income: 0, expense: 0, balance: 0 });

  const [loading, setLoading] = useState(false);
  const [payrollLoading, setPayrollLoading] = useState(false);

  // Modals state
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [bonusPenaltyModalOpen, setBonusPenaltyModalOpen] = useState(false);
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);

  const [breakdownData, setBreakdownData] = useState<PayrollBreakdownData | null>(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  // Payroll Calculation Params
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [defaultStudentFee, setDefaultStudentFee] = useState<number>(300000);

  const [incomeForm] = Form.useForm();
  const [expenseForm] = Form.useForm();
  const [bonusPenaltyForm] = Form.useForm();

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
      const { data } = await apiClient.get<{ success: true; data: FinanceRecord[] }>(
        `/superadmin/finance/payroll?month=${selectedMonth}&year=${selectedYear}&defaultStudentFee=${defaultStudentFee}`,
      );
      setPayroll(data.data ?? []);
    } catch {
      message.error("O'qituvchi oyliklarini yuklashda xatolik yuz berdi");
    } finally {
      setPayrollLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      const { data } = await apiClient.get<{ success: true; data: TeacherUser[] }>('/superadmin/users?role=teacher');
      setTeachers(data.data ?? []);
    } catch {
      // teacher load optional
    }
  };

  useEffect(() => {
    void fetchSummary();
    void loadRecords();
    void loadTeachers();
  }, []);

  useEffect(() => {
    void loadPayroll();
  }, [selectedMonth, selectedYear, defaultStudentFee]);

  // Income Submit
  const handleIncomeSubmit = async () => {
    try {
      const values = await incomeForm.validateFields();
      const payload = {
        name: values.name,
        kind: 'income',
        category: values.category || 'income',
        amount: Number(values.amount ?? 0),
        date: dayjs(values.date ?? new Date()).toISOString(),
        reference: values.reference ?? '',
        description: values.description ?? '',
      };
      await apiClient.post('/superadmin/finance', payload);
      incomeForm.resetFields();
      setIncomeModalOpen(false);
      message.success('Tushum muvaffaqiyatli saqlandi');
      await fetchSummary();
      await loadRecords();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Tushum saqlashda xatolik yuz berdi');
    }
  };

  // Expense Submit
  const handleExpenseSubmit = async () => {
    try {
      const values = await expenseForm.validateFields();
      const payload = {
        name: values.name,
        kind: 'expense',
        category: values.category || 'expense',
        recipient: values.recipient ?? '',
        itemsReceived: values.itemsReceived ?? '',
        amount: Number(values.amount ?? 0),
        date: dayjs(values.date ?? new Date()).toISOString(),
        reference: values.reference ?? '',
        description: values.description ?? '',
      };
      await apiClient.post('/superadmin/finance', payload);
      expenseForm.resetFields();
      setExpenseModalOpen(false);
      message.success('Xarajat muvaffaqiyatli saqlandi');
      await fetchSummary();
      await loadRecords();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Xarajat saqlashda xatolik yuz berdi');
    }
  };

  // Bonus / Penalty Submit
  const handleBonusPenaltySubmit = async () => {
    try {
      const values = await bonusPenaltyForm.validateFields();
      const isBonus = values.type === 'bonus';
      const payload = {
        name: isBonus ? `Rag'bat — ${values.description || 'Rag\'batlantirish'}` : `Jarima — ${values.description || 'Jarima'}`,
        kind: isBonus ? 'income' : 'expense',
        category: isBonus ? 'bonus' : 'penalty',
        teacherId: values.teacherId,
        amount: Number(values.amount ?? 0),
        month: selectedMonth,
        year: selectedYear,
        date: dayjs(values.date ?? new Date()).toISOString(),
        description: values.description ?? '',
      };
      await apiClient.post('/superadmin/finance', payload);
      bonusPenaltyForm.resetFields();
      setBonusPenaltyModalOpen(false);
      message.success(isBonus ? "Rag'bat qo'shildi" : "Jarima qo'shildi");
      await fetchSummary();
      await loadRecords();
      await loadPayroll();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Saqlashda xatolik yuz berdi");
    }
  };

  // Calculate Payroll
  const handleCalculatePayroll = async () => {
    setPayrollLoading(true);
    try {
      const { data } = await apiClient.post<{ success: true; data: { message?: string } }>(
        '/superadmin/finance/payroll/calculate',
        {
          month: selectedMonth,
          year: selectedYear,
          defaultStudentFee,
        },
      );
      message.success(data.data?.message ?? "O'qituvchilar oyligi avtomatik hisoblandi");
      await fetchSummary();
      await loadRecords();
      await loadPayroll();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Oylik hisoblashda xatolik yuz berdi');
    } finally {
      setPayrollLoading(false);
    }
  };

  // Open Breakdown Modal
  const handleOpenBreakdown = async (teacherId: string) => {
    setBreakdownModalOpen(true);
    setBreakdownLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: PayrollBreakdownData }>(
        `/superadmin/finance/payroll/breakdown/${teacherId}?month=${selectedMonth}&year=${selectedYear}&defaultStudentFee=${defaultStudentFee}`,
      );
      setBreakdownData(data.data);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Batafsil ma’lumotni yuklashda xatolik');
    } finally {
      setBreakdownLoading(false);
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    try {
      await apiClient.delete(`/superadmin/finance/${id}`);
      message.success('Yozuv o‘chirildi');
      await fetchSummary();
      await loadRecords();
      await loadPayroll();
    } catch {
      message.error('O‘chirishda xatolik yuz berdi');
    }
  };

  // Filtered Lists
  const incomeRecords = records.filter((r) => r.kind === 'income');
  const expenseRecords = records.filter((r) => r.kind === 'expense');

  // Columns for Income Table
  const incomeColumns = [
    {
      title: 'Sarlavha',
      dataIndex: 'name',
      render: (text: string, record: FinanceRecord) => (
        <div>
          <Typography.Text strong>{text || 'Tushum'}</Typography.Text>
          {record.studentId?.fullName && (
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>O'quvchi: {record.studentId.fullName}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Manba / Hujjat',
      dataIndex: 'reference',
      render: (val: string) => val || '-',
    },
    {
      title: 'Summa',
      dataIndex: 'amount',
      render: (val: number) => <span style={{ color: '#52c41a', fontWeight: 600 }}>+{formatMoney(val)}</span>,
    },
    {
      title: 'Sana',
      dataIndex: 'date',
      render: (val: string) => (val ? dayjs(val).format('DD.MM.YYYY') : '-'),
    },
    {
      title: 'Tavsif',
      dataIndex: 'description',
      render: (val: string) => val || '-',
    },
    {
      title: 'Amallar',
      render: (_: unknown, record: FinanceRecord) => (
        <Popconfirm title="O‘chirilsinmi?" onConfirm={() => handleDeleteRecord(record._id)} okText="Ha" cancelText="Yo'q">
          <Button danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  // Columns for Expenses Table
  const expenseColumns = [
    {
      title: 'Sarlavha',
      dataIndex: 'name',
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
      title: 'Qayerga / Kimga',
      dataIndex: 'recipient',
      render: (val: string) => val ? <Tag color="blue">{val}</Tag> : '-',
    },
    {
      title: 'Nimalar kelgani',
      dataIndex: 'itemsReceived',
      render: (val: string) => (
        <span style={{ fontStyle: val ? 'normal' : 'italic', color: val ? '#262626' : '#8c8c8c' }}>
          {val || 'Ko\'rsatilmadi'}
        </span>
      ),
    },
    {
      title: 'Summa',
      dataIndex: 'amount',
      render: (val: number) => <span style={{ color: '#ff4d4f', fontWeight: 600 }}>-{formatMoney(val)}</span>,
    },
    {
      title: 'Sana',
      dataIndex: 'date',
      render: (val: string) => (val ? dayjs(val).format('DD.MM.YYYY') : '-'),
    },
    {
      title: 'Chek / Hujjat',
      dataIndex: 'reference',
      render: (val: string) => val || '-',
    },
    {
      title: 'Tavsif',
      dataIndex: 'description',
      render: (val: string) => val || '-',
    },
    {
      title: 'Amallar',
      render: (_: unknown, record: FinanceRecord) => (
        <Popconfirm title="O‘chirilsinmi?" onConfirm={() => handleDeleteRecord(record._id)} okText="Ha" cancelText="Yo'q">
          <Button danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  // Columns for Payroll Table
  const payrollColumns = [
    {
      title: 'O‘qituvchi',
      dataIndex: 'teacherId',
      render: (val: { fullName?: string; phone?: string }) => (
        <div>
          <Typography.Text strong>{val?.fullName ?? "O'qituvchi"}</Typography.Text>
          {val?.phone && <div style={{ fontSize: 12, color: '#8c8c8c' }}>{val.phone}</div>}
        </div>
      ),
    },
    {
      title: 'Oy / Yil',
      render: (_: unknown, record: FinanceRecord) =>
        record.month != null && record.year != null
          ? `${dayjs().month(record.month).format('MMMM')} ${record.year}`
          : '-',
    },
    {
      title: 'To‘lanadigan Summa',
      dataIndex: 'amount',
      render: (val: number) => <Typography.Text type="success" strong style={{ fontSize: 15 }}>{formatMoney(val)}</Typography.Text>,
    },
    {
      title: 'Tavsif va Tafsilotlar',
      dataIndex: 'description',
      render: (val: string) => val || '-',
    },
    {
      title: 'Amallar',
      render: (_: unknown, record: FinanceRecord) => (
        <Space>
          {record.teacherId?._id && (
            <Button
              type="primary"
              ghost
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleOpenBreakdown(record.teacherId!._id!)}
            >
              Batafsil
            </Button>
          )}
          <Popconfirm title="O‘chirilsinmi?" onConfirm={() => handleDeleteRecord(record._id)} okText="Ha" cancelText="Yo'q">
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Header & Overall Summary */}
      <Card title={<Typography.Title level={3} style={{ margin: 0 }}>Moliya Boshqaruvi</Typography.Title>}>
        <Row gutter={16}>
          <Col span={8}>
            <Card style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
              <Statistic
                title="Jami Tushum"
                value={summary.income}
                formatter={(val) => formatMoney(Number(val))}
                valueStyle={{ color: '#52c41a' }}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card style={{ background: '#fff2f0', borderColor: '#ffccc7' }}>
              <Statistic
                title="Jami Xarajat"
                value={summary.expense}
                formatter={(val) => formatMoney(Number(val))}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<ShoppingOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card style={{ background: summary.balance >= 0 ? '#e6f7ff' : '#fff1f0', borderColor: summary.balance >= 0 ? '#91d5ff' : '#ffa39e' }}>
              <Statistic
                title="Net Qoldiq"
                value={summary.balance}
                formatter={(val) => formatMoney(Number(val))}
                valueStyle={{ color: summary.balance >= 0 ? '#1890ff' : '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Financial Sub-Sections (Tabs) */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          items={[
            {
              key: 'income',
              label: (
                <span>
                  <DollarOutlined /> Tushumlar ({incomeRecords.length})
                </span>
              ),
              children: (
                <div style={{ display: 'grid', gap: 16 }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Typography.Text type="secondary">
                        Tushumlar bo'limida o'quvchilar to'lovlari hamda qo'lda kiritilgan tushumlar jamlangan.
                      </Typography.Text>
                    </Col>
                    <Col>
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => setIncomeModalOpen(true)}>
                        Qo'lda Tushum Qo'shish
                      </Button>
                    </Col>
                  </Row>

                  <Table
                    rowKey="_id"
                    dataSource={incomeRecords}
                    columns={incomeColumns}
                    loading={loading}
                    pagination={{ pageSize: 8 }}
                    locale={{ emptyText: "Tushumlar mavjud emas" }}
                  />
                </div>
              ),
            },
            {
              key: 'expense',
              label: (
                <span>
                  <ShoppingOutlined /> Xarajatlar ({expenseRecords.length})
                </span>
              ),
              children: (
                <div style={{ display: 'grid', gap: 16 }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Typography.Text type="secondary">
                        Xarajatlar bo'limida qayerga/kimga xarajat qilingani va olingan buyumlar ko'rsatiladi.
                      </Typography.Text>
                    </Col>
                    <Col>
                      <Button type="primary" danger icon={<PlusOutlined />} onClick={() => setExpenseModalOpen(true)}>
                        Qo'lda Xarajat Qo'shish
                      </Button>
                    </Col>
                  </Row>

                  <Table
                    rowKey="_id"
                    dataSource={expenseRecords}
                    columns={expenseColumns}
                    loading={loading}
                    pagination={{ pageSize: 8 }}
                    locale={{ emptyText: "Xarajatlar mavjud emas" }}
                  />
                </div>
              ),
            },
            {
              key: 'payroll',
              label: (
                <span>
                  <UserOutlined /> O'qituvchilar Oyligi
                </span>
              ),
              children: (
                <div style={{ display: 'grid', gap: 20 }}>
                  <Card title="Davomat Bo'yicha Oylik Hisoblash Parametrlari" size="small">
                    <Row gutter={[16, 16]} align="middle">
                      <Col xs={24} sm={8} md={6}>
                        <Form.Item label="Tanlangan Oy" style={{ margin: 0 }}>
                          <Select value={selectedMonth} onChange={setSelectedMonth} options={monthOptions} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8} md={6}>
                        <Form.Item label="Tanlangan Yil" style={{ margin: 0 }}>
                          <Select value={selectedYear} onChange={setSelectedYear} options={yearOptions} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8} md={6}>
                        <Form.Item label="O'quvchi Oylik Stavkasi" style={{ margin: 0 }}>
                          <InputNumber
                            value={defaultStudentFee}
                            onChange={(v) => setDefaultStudentFee(Number(v ?? 300000))}
                            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                            parser={(v) => Number(v?.replace(/\s?/g, '') ?? 300000)}
                            style={{ width: '100%' }}
                            addonAfter="so'm"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={24} md={6}>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                          <Button
                            type="primary"
                            icon={<CalculatorOutlined />}
                            loading={payrollLoading}
                            onClick={handleCalculatePayroll}
                          >
                            Oylik Hisoblash
                          </Button>
                          <Button
                            icon={<TrophyOutlined />}
                            onClick={() => setBonusPenaltyModalOpen(true)}
                          >
                            Rag'bat / Jarima
                          </Button>
                        </Space>
                      </Col>
                    </Row>
                  </Card>

                  <Table
                    rowKey="_id"
                    dataSource={payroll}
                    columns={payrollColumns}
                    loading={payrollLoading}
                    pagination={{ pageSize: 8 }}
                    locale={{ emptyText: "Ushbu oy uchun hisoblangan oylik yozuvlari topilmadi. 'Oylik Hisoblash' tugmasini bosing." }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Manual Income Modal */}
      <Modal
        title="Qo'lda Tushum Qo'shish"
        open={incomeModalOpen}
        onCancel={() => setIncomeModalOpen(false)}
        onOk={handleIncomeSubmit}
        okText="Saqlash"
      >
        <Form form={incomeForm} layout="vertical" initialValues={{ date: dayjs().format('YYYY-MM-DD') }}>
          <Form.Item name="name" label="Sarlavha / Nomi" rules={[{ required: true, message: 'Sarlavha kiriting' }]}>
            <Input placeholder="Masalan: Homiylik tushumi yoki Kitob sotish" />
          </Form.Item>
          <Form.Item name="amount" label="Summa (so'm)" rules={[{ required: true, message: 'Summa kiriting' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="date" label="Sana" rules={[{ required: true, message: 'Sana kiriting' }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="reference" label="Manba / Chek #">
            <Input placeholder="Hujjat raqami yoki manbasi" />
          </Form.Item>
          <Form.Item name="description" label="Tavsif">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Manual Expense Modal */}
      <Modal
        title="Qo'lda Xarajat Qo'shish"
        open={expenseModalOpen}
        onCancel={() => setExpenseModalOpen(false)}
        onOk={handleExpenseSubmit}
        okText="Saqlash"
      >
        <Form form={expenseForm} layout="vertical" initialValues={{ date: dayjs().format('YYYY-MM-DD') }}>
          <Form.Item name="name" label="Sarlavha / Nomi" rules={[{ required: true, message: 'Sarlavha kiriting' }]}>
            <Input placeholder="Masalan: Kantselyariya yoki Internet to'lovi" />
          </Form.Item>
          <Form.Item name="recipient" label="Qayerga / Kimga xarajat qilindi?" rules={[{ required: true, message: 'Kimga/Qayerga xarajat qilinganini kiriting' }]}>
            <Input placeholder="Masalan: Korzinka, Malika bozori, Uztelecom" />
          </Form.Item>
          <Form.Item name="itemsReceived" label="Nimalar kelgan / Olingan buyumlar" rules={[{ required: true, message: 'Olingan narsalarni kiriting' }]}>
            <Input.TextArea rows={2} placeholder="Masalan: 5 ta doska markeri, 2 pachka A4 qog'oz" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label="Summa (so'm)" rules={[{ required: true, message: 'Summa kiriting' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="date" label="Sana" rules={[{ required: true, message: 'Sana kiriting' }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="reference" label="Chek / Hujjat raqami">
            <Input placeholder="Masalan: Chek #12345" />
          </Form.Item>
          <Form.Item name="description" label="Qo'shimcha tavsif">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Bonus / Penalty Modal */}
      <Modal
        title="O'qituvchiga Rag'batlantirish yoki Jarima Qo'shish"
        open={bonusPenaltyModalOpen}
        onCancel={() => setBonusPenaltyModalOpen(false)}
        onOk={handleBonusPenaltySubmit}
        okText="Saqlash"
      >
        <Form form={bonusPenaltyForm} layout="vertical" initialValues={{ type: 'bonus', date: dayjs().format('YYYY-MM-DD') }}>
          <Form.Item name="teacherId" label="O'qituvchi" rules={[{ required: true, message: "O'qituvchini tanlang" }]}>
            <Select
              showSearch
              placeholder="O'qituvchini tanlang"
              optionFilterProp="children"
              options={teachers.map((t) => ({ value: t._id, label: t.fullName }))}
            />
          </Form.Item>
          <Form.Item name="type" label="Turi" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'bonus', label: "Rag'bat (+) — Premium/Mukofot" },
                { value: 'penalty', label: 'Jarima (-) — Ushlanma' },
              ]}
            />
          </Form.Item>
          <Form.Item name="amount" label="Summa (so'm)" rules={[{ required: true, message: 'Summa kiriting' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="date" label="Sana">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="description" label="Sababi / Izoh" rules={[{ required: true, message: 'Sababini kiriting' }]}>
            <Input.TextArea rows={3} placeholder="Masalan: Yaxshi ko'rsatkichlar uchun mukofot yoki darsga kechikkani uchun jarima" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Breakdown Detailed Modal */}
      <Modal
        title={`O'qituvchi Oylik Hisobi Batafsil (${dayjs().month(selectedMonth).format('MMMM')} ${selectedYear})`}
        open={breakdownModalOpen}
        onCancel={() => setBreakdownModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setBreakdownModalOpen(false)}>
            Yopish
          </Button>,
        ]}
        width={900}
      >
        {breakdownLoading ? (
          <div style={{ textAlign: 'center', padding: 30 }}>Yuklanmoqda...</div>
        ) : breakdownData ? (
          <div style={{ display: 'grid', gap: 20 }}>
            <Descriptions title={breakdownData.teacher?.fullName} bordered size="small" column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Hisoblangan Baza Oylik">
                <Typography.Text strong>{formatMoney(breakdownData.baseSalary)}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Jami Rag'batlar (+)">
                <Typography.Text type="success">+{formatMoney(breakdownData.totalBonus)}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Jami Jarimalar (-)">
                <Typography.Text type="danger">-{formatMoney(breakdownData.totalPenalty)}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Yakuniy To'lanadigan Oylik">
                <Typography.Text type="success" strong style={{ fontSize: 16 }}>
                  {formatMoney(breakdownData.netPayable)}
                </Typography.Text>
              </Descriptions.Item>
            </Descriptions>

            <Card title="O'quvchilar Davomati va Darslar Narxi Kesimida Hisob" size="small">
              <Table
                rowKey={(r) => `${r.groupId}_${r.studentId}`}
                dataSource={breakdownData.studentBreakdown}
                pagination={false}
                size="small"
                columns={[
                  { title: 'Guruh', dataIndex: 'groupName' },
                  { title: 'O\'quvchi F.I.Sh', dataIndex: 'studentName' },
                  {
                    title: 'O\'quvchi Oylik Stavkasi',
                    dataIndex: 'studentFee',
                    render: (v: number) => formatMoney(v),
                  },
                  { title: 'Oy Davomidagi Darslar', dataIndex: 'totalLessons' },
                  {
                    title: 'Kelgan Darslari (Davomat)',
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
                    title: 'O\'qituvchi Hissasi',
                    dataIndex: 'contribution',
                    render: (v: number) => <Typography.Text strong type="success">+{formatMoney(v)}</Typography.Text>,
                  },
                ]}
              />
            </Card>

            {breakdownData.bonusesAndPenalties.length > 0 && (
              <Card title="Rag'batlar va Jarimalar Ro'yxati" size="small">
                <Table
                  rowKey="_id"
                  dataSource={breakdownData.bonusesAndPenalties}
                  pagination={false}
                  size="small"
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
                      render: (v: number, r: FinanceRecord) =>
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
        ) : (
          <div>Ma'lumot topilmadi</div>
        )}
      </Modal>
    </div>
  );
}
