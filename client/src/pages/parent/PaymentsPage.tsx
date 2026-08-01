import { useEffect, useState } from 'react';
import { Card, Table, Select, message } from 'antd';
import { apiClient } from '../../api/client';

interface ChildRecord {
  _id: string;
  studentId?: { _id?: string; fullName?: string };
}

interface PaymentRecord {
  _id: string;
  amount?: number;
  paymentDate?: string;
  paymentType?: string;
  status?: string;
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
        setSelectedChildId(data.data[0]._id);
      }
    } catch {
      message.error('Farzandlar yuklashda xatolik');
    }
  };

  const loadPayments = async (childId: string) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: PaymentRecord[] }>(`/parent/children/${childId}/payments`);
      setItems(data.data);
    } catch {
      message.error('To‘lovlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      void loadPayments(selectedChildId);
    }
  }, [selectedChildId]);

  return (
    <Card title="Farzandlarim to‘lovlari">
      <Select
        style={{ width: 300, marginBottom: 16 }}
        value={selectedChildId ?? undefined}
        onChange={(value) => setSelectedChildId(value)}
        options={children.map((child) => ({ value: child._id, label: child.studentId?.fullName ?? 'Noma’lum' }))}
      />

      <Table
        rowKey="_id"
        columns={[
          { title: 'Summa', dataIndex: 'amount' as const },
          { title: 'Sana', dataIndex: 'paymentDate' as const },
          { title: 'Tur', dataIndex: 'paymentType' as const },
          { title: 'Holat', dataIndex: 'status' as const },
        ]}
        dataSource={items}
        loading={loading}
        pagination={false}
      />
    </Card>
  );
}
