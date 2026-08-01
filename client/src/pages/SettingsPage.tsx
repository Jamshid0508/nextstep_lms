import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, message } from 'antd';
import { apiClient } from '../api/client';

interface SettingsRecord {
  _id: string;
  organizationName?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  timezone?: string;
  currency?: string;
}

export function SettingsPage() {
  const [form] = Form.useForm<SettingsRecord>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get<{ success: true; data: SettingsRecord }>('/superadmin/settings');
        form.setFieldsValue(data.data);
      } catch {
        message.error('Sozlamalarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    })();
  }, [form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const { data } = await apiClient.patch<{ success: true; data: SettingsRecord }>(`/superadmin/settings/${values._id}`, values);
      form.setFieldsValue(data.data);
      message.success('Sozlamalar saqlandi');
    } catch {
      message.error('Sozlamalarni saqlashda xatolik yuz berdi');
    }
  };

  return (
    <Card title="Sozlamalar" extra={<Button type="primary" onClick={handleSave} loading={loading}>Saqlash</Button>}>
      <Form form={form} layout="vertical">
        <Form.Item name="organizationName" label="Tashkilot nomi">
          <Input />
        </Form.Item>
        <Form.Item name="address" label="Manzil">
          <Input />
        </Form.Item>
        <Form.Item name="phone" label="Telefon">
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Email">
          <Input />
        </Form.Item>
        <Form.Item name="website" label="Website">
          <Input />
        </Form.Item>
        <Form.Item name="timezone" label="Timezone">
          <Input />
        </Form.Item>
        <Form.Item name="currency" label="Valyuta">
          <Input />
        </Form.Item>
      </Form>
    </Card>
  );
}
