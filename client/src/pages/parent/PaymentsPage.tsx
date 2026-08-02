import { useEffect, useState } from 'react';
import { Card, Table, Select, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '../../api/client';

interface ChildRecord {
  _id: string;
  studentId?: { _id?: string; fullName?: string };
  relationship?: string;
}

interface PaymentRecord {
  _id: string;
  amount?: number;
  paymentDate?: string;
  paymentType?: string;
  paymentMethod?: string;
  status?: string;
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  monthly: 'Oylik',
  one_time: 'Bir martalik',
  discount: 'Chegirma',
  penalty: 'Jarima',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Naqd pul',
  card: 'Plastik karta',
  transfer: "Bank o'tkazmasi",
  bank_transfer: "Bank o'tkazmasi",
};

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  paid: { label: "To'langan", color: 'green' },
  pending: { label: 'Kutilmoqda', color: 'orange' },
  overdue: { label: "Muddati o'tgan", color: 'red' },
};

function formatMoney(value?: number) {
  return value == null ? '-' : `${value.toLocaleString('ru-RU')} so'm`;
}

export function PaymentsPage() {
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [items, setItems] = useState<PaymentRecord[]>([]);
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

  const loadPayments = async (studentId: string) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: PaymentRecord[] }>(
        `/parent/children/${studentId}/payments`,
      );
      setItems(data.data);
    } catch {
      message.error("To'lovlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) void loadPayments(selectedChildId);
  }, [selectedChildId]);

  return (
    <Card title="Farzandlarim to'lovlari">
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
          {
            title: 'Summa',
            dataIndex: 'amount' as const,
            render: (v: number) => formatMoney(v),
          },
          {
            title: 'Sana',
            dataIndex: 'paymentDate' as const,
            render: (v: string) => (v ? dayjs(v).format('DD.MM.YYYY') : '-'),
          },
          {
            title: "To'lov turi",
            dataIndex: 'paymentType' as const,
            render: (v: string) => PAYMENT_TYPE_LABELS[v] ?? v ?? '-',
          },
          {
            title: "To'lov usuli",
            dataIndex: 'paymentMethod' as const,
            render: (v: string) => PAYMENT_METHOD_LABELS[v] ?? v ?? '-',
          },
          {
            title: 'Holat',
            dataIndex: 'status' as const,
            render: (v: string) => {
              const st = PAYMENT_STATUS[v];
              return st ? <Tag color={st.color}>{st.label}</Tag> : v ?? '-';
            },
          },
        ]}
        dataSource={items}
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: "To'lovlar topilmadi" }}
      />
    </Card>
  );
}
