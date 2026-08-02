import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Card, Form, Modal, Space, Table, message } from 'antd';
import type { FormInstance, TableColumnsType } from 'antd';
import { apiClient } from '../../api/client';

export interface CrudPageColumn<T> {
  title: string;
  dataIndex?: keyof T | string;
  render?: (value: unknown, record: T) => ReactNode;
}

interface CrudPageProps<T extends Record<string, any>> {
  title: string;
  endpoint: string;
  columns: CrudPageColumn<T>[];
  formItems: (form: FormInstance) => React.ReactNode;
  onSuccess?: () => void;
  extra?: React.ReactNode;
}

export function CrudPage<T extends Record<string, any>>({
  title,
  endpoint,
  columns,
  formItems,
  onSuccess,
  extra,
}: CrudPageProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: T[] }>(endpoint);
      setItems(data.data);
    } catch {
      message.error('Ma’lumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
  }, [endpoint]);

  const getItemEndpoint = (id: string) => {
    const base = endpoint.split('?')[0];
    return `${base}/${id}`;
  };

  const getBaseEndpoint = () => endpoint.split('?')[0];

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await apiClient.patch(getItemEndpoint(editingId), values);
        message.success('Ma’lumot yangilandi');
      } else {
        await apiClient.post(getBaseEndpoint(), values);
        message.success('Ma’lumot yaratildi');
      }
      form.resetFields();
      setOpen(false);
      setEditingId(null);
      await fetchItems();
      onSuccess?.();
    } catch {
      message.error('Ma’lumotni saqlashda xatolik yuz berdi');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(getItemEndpoint(id));
      message.success('Ma’lumot o’chirildi');
      await fetchItems();
    } catch {
      message.error('Ma’lumotni o’chirishda xatolik yuz berdi');
    }
  };

  const tableColumns = useMemo<TableColumnsType<T>>(() => {
    return [
      ...columns.map((column) => ({
        ...column,
        title: column.title,
        dataIndex: column.dataIndex as never,
        render: column.render,
      })),
      {
        title: 'Harakatlar',
        key: 'actions',
        render: (_value: unknown, record: T) => (
          <Space>
            <Button
              size="small"
              onClick={() => {
                setEditingId(String((record as any)._id ?? record.id));
                form.setFieldsValue(record);
                setOpen(true);
              }}
            >
              Tahrirlash
            </Button>
            <Button size="small" danger onClick={() => handleDelete(String((record as any)._id ?? record.id))}>
              O’chirish
            </Button>
          </Space>
        ),
      },
    ];
  }, [columns, form]);

  return (
    <Card title={title} extra={<Space>{extra}{extra ? null : null}<Button onClick={() => setOpen(true)}>Yangi qo’shish</Button></Space>}>
      <Table rowKey="_id" columns={tableColumns} dataSource={items} loading={loading} />

      <Modal
        title={editingId ? 'Tahrirlash' : 'Yangi qo’shish'}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditingId(null);
          form.resetFields();
        }}
        onOk={handleCreate}
        okText={editingId ? 'Saqlash' : 'Qo’shish'}
      >
        <Form form={form} layout="vertical">
          {formItems(form)}
        </Form>
      </Modal>
    </Card>
  );
}
