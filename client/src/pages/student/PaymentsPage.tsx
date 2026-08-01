import { useEffect, useState } from 'react';
import { Card, Table } from 'antd';
import { apiClient } from '../../api/client';

interface PaymentRecord {
  _id: string;
  amount?: number;
  paymentDate?: string;
  paymentType?: string;
  status?: string;
}

export function PaymentsPage() {
  const [items, setItems] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get<{ success: true; data: PaymentRecord[] }>('/student/payments');
        setItems(data.data);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const columns = [
    { title: 'Summa', dataIndex: 'amount' as const },
    { title: 'Sana', dataIndex: 'paymentDate' as const },
    { title: 'Tur', dataIndex: 'paymentType' as const },
    { title: 'Holat', dataIndex: 'status' as const },
  ];

  return (
    <Card title="To'lovlarim">
      <Table rowKey="_id" columns={columns} dataSource={items} loading={loading} pagination={false} />
    </Card>
  );
}
