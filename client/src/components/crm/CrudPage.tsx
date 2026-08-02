import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Button, Card, Form, Modal, Space, Table, message } from 'antd';
import type { FormInstance, TableColumnsType } from 'antd';
import { apiClient } from '../../api/client';
import { extractErrorMessage } from '../../utils/error';

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
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form] = Form.useForm();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: T[] }>(endpoint);
      setItems(data.data);
    } catch {
      message.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
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
    setFormError(null);
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingId) {
        await apiClient.patch(getItemEndpoint(editingId), values);
        message.success("Ma'lumot yangilandi");
      } else {
        await apiClient.post(getBaseEndpoint(), values);
        message.success("Ma'lumot yaratildi");
      }
      form.resetFields();
      setOpen(false);
      setEditingId(null);
      await fetchItems();
      onSuccess?.();
    } catch (err: any) {
      if (err?.errorFields) return; // Antd Form inline validation error
      const errMsg = extractErrorMessage(err, "Ma'lumotni saqlashda xatolik yuz berdi");
      setFormError(errMsg);
      message.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(getItemEndpoint(id));
      message.success("Ma'lumot o'chirildi");
      await fetchItems();
    } catch (err: any) {
      const errMsg = extractErrorMessage(err, "Ma'lumotni o'chirishda xatolik yuz berdi");
      message.error(errMsg);
    }
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setFormError(null);
    form.resetFields();
    setOpen(true);
  };

  const handleOpenEdit = (record: T) => {
    setEditingId(String((record as any)._id ?? record.id));
    setFormError(null);
    form.setFieldsValue(record);
    setOpen(true);
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
            <Button size="small" onClick={() => handleOpenEdit(record)}>
              Tahrirlash
            </Button>
            <Button size="small" danger onClick={() => handleDelete(String((record as any)._id ?? record.id))}>
              O'chirish
            </Button>
          </Space>
        ),
      },
    ];
  }, [columns, form]);

  return (
    <Card
      title={title}
      extra={
        <Space>
          {extra}
          <Button type="primary" onClick={handleOpenNew}>
            Yangi qo'shish
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="_id"
        columns={tableColumns}
        dataSource={items}
        loading={loading}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={editingId ? 'Tahrirlash' : "Yangi qo'shish"}
        open={open}
        confirmLoading={submitting}
        onCancel={() => {
          setOpen(false);
          setEditingId(null);
          setFormError(null);
          form.resetFields();
        }}
        onOk={handleCreate}
        okText={editingId ? 'Saqlash' : "Qo'shish"}
      >
        {formError && (
          <Alert
            type="error"
            showIcon
            message="Xatolik:"
            description={formError}
            style={{ marginBottom: 16, borderRadius: 8 }}
          />
        )}
        <Form form={form} layout="vertical">
          {formItems(form)}
        </Form>
      </Modal>
    </Card>
  );
}
