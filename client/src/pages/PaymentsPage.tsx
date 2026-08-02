import { useEffect, useMemo, useState } from 'react';
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
  Table,
  Typography,
  message,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '../api/client';

interface PaymentRecord {
  _id: string;
  studentId?: { _id: string; fullName?: string };
  groupId?: { _id: string; name?: string };
  amount?: number;
  paymentDate?: string;
  paymentType?: string;
  paymentMethod?: string;
  status?: string;
  note?: string;
  createdAt?: string;
}

interface ReferenceData {
  students: Array<{ _id: string; fullName: string; studentType?: 'restricted' | 'paid' }>;
  groups: Array<{ _id: string; name: string; courseId?: { _id: string; name?: string; price?: number } | string }>;
}

interface BankInfo {
  prefix: string;
  bankName: string;
  accountNumber: string;
  inn: string;
  mfo: string;
  phone: string;
  responsible: string;
}

const MONTHS = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'Iyun',
  'Iyul',
  'Avgust',
  'Sentabr',
  'Oktabr',
  'Noyabr',
  'Dekabr',
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Naqd' },
  { value: 'card', label: 'Bank karta' },
  { value: 'transfer', label: 'O‘tkazma' },
];

const PAYMENT_TYPES = [
  { value: 'monthly', label: 'Oylik' },
  { value: 'one_time', label: 'Bir martalik' },
  { value: 'discount', label: 'Chegirma' },
  { value: 'penalty', label: 'Jarroha' },
];

function formatMoney(value?: number) {
  return value == null ? '-' : `${value.toLocaleString('ru-RU')} so'm`;
}

function getSavedBankInfo(): BankInfo {
  const saved = localStorage.getItem('bankInfo');
  if (!saved) {
    return {
      prefix: 'ITC',
      bankName: 'Men Bank',
      accountNumber: '12345678901234567890',
      inn: '123456789',
      mfo: '00100',
      phone: '+998 901234567',
      responsible: 'Panjiyev J',
    };
  }

  try {
    return JSON.parse(saved) as BankInfo;
  } catch {
    return getSavedBankInfo();
  }
}

export function PaymentsPage() {
  const [form] = Form.useForm();
  const [bankForm] = Form.useForm();
  const [references, setReferences] = useState<ReferenceData>({ students: [], groups: [] });
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<PaymentRecord | null>(null);
  const [bankInfo, setBankInfo] = useState<BankInfo>(getSavedBankInfo());
  const [selectedMonth, setSelectedMonth] = useState<number>(dayjs().month());
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());
  const [groupFilter, setGroupFilter] = useState<string>('');
  const [referenceLoading, setReferenceLoading] = useState(false);

  useEffect(() => {
    setReferenceLoading(true);
    void apiClient
      .get<{ success: true; data: ReferenceData }>('/superadmin/references')
      .then(({ data }) => {
        setReferences({ groups: data.data.groups ?? [], students: data.data.students ?? [] });
      })
      .catch(() => {
        message.error('Guruhlar va o‘quvchilar yuklanmadi');
      })
      .finally(() => {
        setReferenceLoading(false);
      });
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: PaymentRecord[] }>('/superadmin/payments');
      setPayments(data.data);
    } catch (error) {
      message.error('To‘lovlar yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPayments();
  }, []);

  const handleSaveBankInfo = () => {
    const values = bankForm.getFieldsValue();
    setBankInfo(values);
    localStorage.setItem('bankInfo', JSON.stringify(values));
    message.success('Bank ma’lumotlari saqlandi');
  };

  const handleOpenPaymentModal = () => {
    form.resetFields();
    form.setFieldsValue({ month: selectedMonth, year: selectedYear, paymentMethod: 'cash', paymentType: 'monthly' });
    setPaymentModalOpen(true);
  };

  const handleCreateMonthlyReport = () => {
    const selectedGroup = references.groups.find((item) => item._id === groupFilter);
    const paymentsForMonth = payments.filter((payment) => {
      const date = payment.paymentDate ? dayjs(payment.paymentDate) : undefined;
      const matchesMonth = date ? date.month() === selectedMonth : false;
      const matchesYear = date ? date.year() === selectedYear : false;
      const matchesGroup = selectedGroup ? payment.groupId?._id === selectedGroup._id : true;
      return matchesMonth && matchesYear && matchesGroup;
    });

    const total = paymentsForMonth.reduce((sum, item) => sum + (item.amount ?? 0), 0);
    Modal.info({
      title: 'Oylik hisob',
      width: 520,
      content: (
        <div>
          <p>{selectedGroup ? `Guruh: ${selectedGroup.name}` : 'Tanlangan guruh: barcha'}</p>
          <p>Oy: {MONTHS[selectedMonth]}</p>
          <p>Yil: {selectedYear}</p>
          <p>To‘lovlar soni: {paymentsForMonth.length}</p>
          <p>Jami summa: {formatMoney(total)}</p>
        </div>
      ),
    });
  };

  const getGroupCoursePrice = (groupId?: string) => {
    const group = references.groups.find((item) => item._id === groupId);
    const course = typeof group?.courseId === 'object' ? group.courseId : null;
    return Number(course?.price ?? 0) || 0;
  };

  const getStudentPaidTotal = (studentId?: string, groupId?: string) => {
    if (!studentId || !groupId) {
      return 0;
    }

    return payments.reduce((sum, payment) => {
      const sameStudent = payment.studentId?._id === studentId;
      const sameGroup = payment.groupId?._id === groupId;
      return sameStudent && sameGroup ? sum + (Number(payment.amount) || 0) : sum;
    }, 0);
  };

  const syncPaymentAmount = (groupId?: string, studentId?: string) => {
    const targetGroupId = groupId ?? form.getFieldValue('groupId');
    const targetStudentId = studentId ?? form.getFieldValue('studentId');
    const coursePrice = getGroupCoursePrice(targetGroupId);
    const paidTotal = getStudentPaidTotal(targetStudentId, targetGroupId);
    const remaining = Math.max(0, coursePrice - paidTotal);

    if (targetGroupId && targetStudentId) {
      form.setFieldsValue({ amount: remaining || 0 });
    }
  };

  const handleSubmitPayment = async () => {
    try {
      const values = await form.validateFields();
      const paymentDate = values.month != null && values.year != null
        ? dayjs(new Date(values.year, values.month, 1)).toISOString()
        : dayjs().toISOString();

      const coursePrice = getGroupCoursePrice(values.groupId);
      const paidTotal = getStudentPaidTotal(values.studentId, values.groupId);
      const remainingBefore = Math.max(0, coursePrice - paidTotal);
      const normalizedAmount = remainingBefore > 0 ? Math.min(Number(values.amount) || 0, remainingBefore) : 0;

      const paymentData = {
        studentId: values.studentId,
        groupId: values.groupId,
        amount: normalizedAmount,
        paymentType: values.paymentType,
        paymentMethod: values.paymentMethod,
        status: 'paid',
        paymentDate,
        paidDate: dayjs().toISOString(),
        note: values.note,
      };

      const { data } = await apiClient.post<{ success: true; data: PaymentRecord }>('/superadmin/payments', paymentData);
      setPayments((prev) => [data.data, ...prev]);
      setReceiptPayment(data.data);
      setPaymentModalOpen(false);
      setReceiptModalOpen(true);
      message.success('To‘lov qabul qilindi');
    } catch (error: any) {
      const description = error?.response?.data?.message || error?.message || 'To‘lov qabul qilishda xatolik yuz berdi';
      message.error(description);
    }
  };

  const paidStudents = useMemo(
    () => references.students.filter((student) => student.studentType === 'paid'),
    [references.students],
  );

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const isPaidStudent = payment.studentId?._id
        ? paidStudents.some((student) => student._id === payment.studentId?._id)
        : true;
      const date = payment.paymentDate ? dayjs(payment.paymentDate) : undefined;
      const matchesMonth = date ? date.month() === selectedMonth : false;
      const matchesYear = date ? date.year() === selectedYear : false;
      const matchesGroup = groupFilter
        ? payment.groupId?._id === groupFilter
        : true;
      return isPaidStudent && matchesMonth && matchesYear && matchesGroup;
    });
  }, [paidStudents, payments, selectedMonth, selectedYear, groupFilter]);

  const receiptDate = receiptPayment?.paymentDate ? dayjs(receiptPayment.paymentDate) : dayjs();
  const courseTotal = receiptPayment ? getGroupCoursePrice(receiptPayment.groupId?._id) : 0;
  const receiptPaidTotal = receiptPayment ? getStudentPaidTotal(receiptPayment.studentId?._id, receiptPayment.groupId?._id) : 0;
  const remainingBalance = Math.max(0, courseTotal - receiptPaidTotal);
  const showBalanceRow = true;

  const receiptContent = (
    <div className="receipt-print-wrapper" style={{ width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            style={{
              borderRadius: 18,
              overflow: 'hidden',
              boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
              background: '#fff',
              minHeight: 330,
              maxHeight: 360,
            }}
          >
            <div style={{ background: '#1f2b68', color: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, opacity: 0.75 }}>CHEK №</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>ITC0001</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, opacity: 0.75 }}>SANA</div>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{receiptDate.format('DD.MM.YYYY')}</div>
                <div style={{ fontSize: 11, opacity: 0.75 }}>VAQT</div>
                <div style={{ fontSize: 12 }}>{receiptDate.format('HH:mm')}</div>
              </div>
            </div>
            <div style={{ padding: 14, fontSize: 12 }}>
              <div style={{ marginBottom: 8 }}>
                <Typography.Text strong>O‘quvchi:</Typography.Text>
                <div>{receiptPayment?.studentId?.fullName ?? '—'}</div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Typography.Text strong>Guruh:</Typography.Text>
                <div>{receiptPayment?.groupId?.name ?? '—'}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <Typography.Text type="secondary">To‘lov usuli</Typography.Text>
                  <div>{PAYMENT_METHODS.find((item) => item.value === receiptPayment?.paymentMethod)?.label ?? '—'}</div>
                </div>
                <div>
                  <Typography.Text type="secondary">Oy</Typography.Text>
                  <div>{receiptDate.format('MMMM')}</div>
                </div>
              </div>
              <div style={{ background: '#f3f5ff', borderRadius: 12, padding: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Typography.Text type="secondary">Jami</Typography.Text>
                  <Typography.Text strong>{formatMoney(courseTotal)}</Typography.Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: showBalanceRow ? 6 : 0 }}>
                  <Typography.Text type="secondary">To‘landi</Typography.Text>
                  <Typography.Text strong style={{ color: '#2f8a14' }}>{formatMoney(receiptPaidTotal)}</Typography.Text>
                </div>
                {showBalanceRow && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography.Text type="secondary">Qoldiq</Typography.Text>
                    <Typography.Text strong style={{ color: '#d32f2f' }}>{formatMoney(remainingBalance)}</Typography.Text>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 8 }}>
                <Typography.Text type="secondary">So‘z bilan:</Typography.Text>
                <div>{receiptPayment ? `${receiptPayment.amount?.toLocaleString('ru-RU')} so'm` : '—'}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <Typography.Text type="secondary">Bank nomi</Typography.Text>
                  <div>{bankInfo.bankName}</div>
                </div>
                <div>
                  <Typography.Text type="secondary">H/R</Typography.Text>
                  <div>{bankInfo.accountNumber}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                <div>
                  <Typography.Text type="secondary">INN</Typography.Text>
                  <div>{bankInfo.inn}</div>
                </div>
                <div>
                  <Typography.Text type="secondary">MFO</Typography.Text>
                  <div>{bankInfo.mfo}</div>
                </div>
              </div>
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Typography.Text type="secondary">Mas’ul</Typography.Text>
                  <div>{bankInfo.responsible}</div>
                </div>
                <div style={{ minWidth: 110, padding: '8px 10px', border: '1px dashed rgba(0,0,0,0.2)', borderRadius: 8 }}>
                  <Typography.Text type="secondary">Imzo</Typography.Text>
                  <div style={{ height: 18 }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const handleDeletePayment = async (paymentId: string) => {
    try {
      await apiClient.delete(`/superadmin/payments/${paymentId}`);
      setPayments((prev) => prev.filter((payment) => payment._id !== paymentId));
      if (receiptPayment?._id === paymentId) {
        setReceiptPayment(null);
      }
      message.success('To‘lov o‘chirildi');
    } catch (error: any) {
      const description = error?.response?.data?.message || error?.message || 'To‘lovni o‘chirishda xatolik yuz berdi';
      message.error(description);
    }
  };

  const columns: any[] = [
    { title: 'Talaba', dataIndex: ['studentId', 'fullName'] as any, render: (_value: unknown, record: PaymentRecord) => record.studentId?.fullName ?? '-' },
    { title: 'Guruh', dataIndex: ['groupId', 'name'] as any, render: (_value: unknown, record: PaymentRecord) => record.groupId?.name ?? '-' },
    { title: 'Summa', dataIndex: 'amount' as const, render: (value: unknown) => formatMoney(value as number) },
    { title: 'Usul', dataIndex: 'paymentMethod' as const, render: (value: unknown) => PAYMENT_METHODS.find((item) => item.value === value)?.label ?? '-' },
    { title: 'Sana', dataIndex: 'paymentDate' as const, render: (value: unknown) => (value ? dayjs(String(value)).format('DD.MM.YYYY') : '-') },
    { title: 'Izoh', dataIndex: 'note' as const },
    {
      title: 'Harakat',
      key: 'actions',
      render: (_value: unknown, record: PaymentRecord) => (
        <Space>
          <Button size="small" onClick={() => { setReceiptPayment(record); setReceiptModalOpen(true); }}>
            Ko‘rish
          </Button>
          <Button size="small" danger onClick={() => void handleDeletePayment(record._id)}>
            O‘chirish
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <style>{`
        @media print {
          body {
            background: #fff !important;
          }
          .ant-layout-sider,
          .ant-table-wrapper,
          .ant-btn,
          .ant-select,
          .ant-input,
          .ant-form,
          .ant-modal-footer,
          .ant-modal-header,
          .ant-modal-close,
          .ant-picker,
          .ant-dropdown,
          .ant-tooltip,
          .print-hidden,
          .ant-card:not(.receipt-print-modal),
          .ant-modal-mask {
            display: none !important;
            visibility: hidden !important;
          }
          .receipt-print-modal,
          .receipt-print-modal .ant-modal,
          .receipt-print-modal .ant-modal-content,
          .receipt-print-modal .ant-modal-body {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            inset: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          .receipt-print-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            display: block !important;
          }
          .receipt-print-card {
            min-height: 760px !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

      <div style={{ paddingBottom: 24 }}>
      <Card style={{ borderRadius: 24, marginBottom: 24 }} bodyStyle={{ padding: 24 }}>
        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24 }}>
          <Col xs={24} md={8}>
            <Select
              showSearch
              allowClear
              loading={referenceLoading}
              placeholder="Guruh tanlang"
              value={groupFilter || undefined}
              onChange={(value) => setGroupFilter(value ?? '')}
              options={references.groups.map((item) => ({ value: item._id, label: item.name }))}
              optionFilterProp="label"
              filterOption={(input, option) =>
                String(option?.label || '').toLowerCase().includes(String(input).toLowerCase())
              }
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={8}>
            <Select
              value={selectedMonth}
              onChange={(value) => setSelectedMonth(value)}
              options={MONTHS.map((label, index) => ({ value: index, label }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              value={selectedYear}
              onChange={(value) => setSelectedYear(value)}
              options={Array.from({ length: 5 }, (_, index) => {
                const yearValue = dayjs().year() - 2 + index;
                return { value: yearValue, label: String(yearValue) };
              })}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={4}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button icon={<ReloadOutlined />} onClick={() => void loadPayments()}>
                Yangilash
              </Button>
            </Space>
          </Col>
          <Col xs={24} md={24} style={{ textAlign: 'right' }}>
            <Space wrap>
              <Button type="default" onClick={handleCreateMonthlyReport}>Oylik hisob yaratish</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenPaymentModal}>
                To'lov qabul qilish
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 24, marginBottom: 24, background: '#f8f9ff' }} bodyStyle={{ padding: 24 }}>
        <Typography.Title level={5}>BANK MA'LUMOTLARI</Typography.Title>
        <Typography.Text type="secondary">Chek chiqarishda ishlatiladigan ma'lumotlarni bir marta kiriting.</Typography.Text>
        <Form form={bankForm} layout="vertical" initialValues={bankInfo} style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="prefix" label="Chek prefiksi">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="bankName" label="Bank nomi">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="accountNumber" label="Hisob raqam (H/R)">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="inn" label="INN">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="mfo" label="MFO">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="phone" label="Telefon raqami">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="responsible" label="Mas'ul shaxs">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6} style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button type="primary" block onClick={handleSaveBankInfo}>
                Bank ma'lumotlarini saqlash
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card style={{ borderRadius: 24 }} bodyStyle={{ padding: 24 }}>
        <Table<PaymentRecord>
          rowKey="_id"
          loading={loading}
          columns={columns}
          dataSource={filteredPayments}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal
        title="To'lov qabul qilish"
        open={paymentModalOpen}
        onCancel={() => setPaymentModalOpen(false)}
        onOk={handleSubmitPayment}
        okText="Qabul qilish va chek chiqarish"
        cancelText="Bekor qilish"
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="groupId" label="Guruh" rules={[{ required: true, message: 'Guruh tanlang' }]}> 
            <Select
              showSearch
              placeholder="Guruh tanlang"
              options={references.groups.map((item) => ({ value: item._id, label: item.name }))}
              optionFilterProp="label"
              onChange={(value) => {
                const selectedStudentId = form.getFieldValue('studentId');
                syncPaymentAmount(value, selectedStudentId);
              }}
            />
          </Form.Item>
          <Form.Item name="studentId" label="O'quvchi" rules={[{ required: true, message: 'O’quvchi tanlang' }]}> 
            <Select
              showSearch
              placeholder="O'quvchi tanlang"
              options={paidStudents.map((item) => ({ value: item._id, label: item.fullName }))}
              optionFilterProp="label"
              onChange={(value) => {
                const selectedGroupId = form.getFieldValue('groupId');
                syncPaymentAmount(selectedGroupId, value);
              }}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="month" label="Oy">
                <Select options={MONTHS.map((label, index) => ({ value: index, label }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="year" label="Yil">
                <Select
                  options={Array.from({ length: 5 }, (_, index) => {
                    const yearValue = dayjs().year() - 2 + index;
                    return { value: yearValue, label: String(yearValue) };
                  })}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="amount" label="To'lov summasi (UZS)" rules={[{ required: true, message: 'Summani kiriting' }]}> 
            <InputNumber<number>
              min={0}
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
              parser={(value) => Number(String(value).replace(/\s?/g, '')) || 0}
            />
          </Form.Item>
          <Form.Item name="paymentType" label="To'lov turi" rules={[{ required: true, message: 'To‘lov turini tanlang' }]} initialValue="monthly">
            <Select options={PAYMENT_TYPES} />
          </Form.Item>
          <Form.Item name="paymentMethod" label="To'lov usuli" initialValue="cash">
            <Select options={PAYMENT_METHODS} />
          </Form.Item>
          <Form.Item name="note" label="Izoh">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        className="receipt-print-modal"
        title="To'lov cheki"
        open={receiptModalOpen}
        onCancel={() => setReceiptModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setReceiptModalOpen(false)}>
            Yopish
          </Button>,
          <Button key="print" type="primary" onClick={() => window.print()}>
            Chop etish
          </Button>,
        ]}
        width={1000}
        bodyStyle={{ padding: 24 }}
      >
        {receiptContent}
      </Modal>
    </div>
    </>
  );
}
