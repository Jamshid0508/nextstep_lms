import { useEffect, useState } from 'react';
import { Card, List, Button, Modal, Form, Input, message } from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '../../api/client';

interface HomeworkRecord {
  _id: string;
  title?: string;
  groupId?: { name?: string };
  dueDate?: string;
  status?: string;
}

export function HomeworksPage() {
  const [items, setItems] = useState<HomeworkRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<HomeworkRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: HomeworkRecord[] }>('/student/homeworks');
      setItems(data.data);
    } catch {
      message.error('Uy vazifalarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const openSubmitModal = (homework: HomeworkRecord) => {
    setSelectedHomework(homework);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await apiClient.post(`/student/homeworks/${selectedHomework?._id}/submit`, values);
      message.success('Uy vazifa topshirildi');
      setIsModalOpen(false);
      setSelectedHomework(null);
      await loadItems();
    } catch {
      message.error('Uy vazifani topshirishda xatolik yuz berdi');
    }
  };

  return (
    <Card title="Uy vazifalarim">
      <List
        loading={loading}
        dataSource={items}
        renderItem={(item) => (
          <List.Item actions={[<Button type="link" onClick={() => openSubmitModal(item)}>Topshirish</Button>]}> 
            <List.Item.Meta
              title={item.title}
              description={`Guruh: ${(item.groupId as any)?.name ?? '-'} | Yakunlanish: ${item.dueDate ? dayjs(String(item.dueDate)).format('DD.MM.YYYY') : '-'} | Holat: ${item.status ?? '-'}`}
            />
          </List.Item>
        )}
      />

      <Modal
        title={`“${selectedHomework?.title}” topshirish`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSubmit}
        okText="Topshirish"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="submissionText" label="Javob matni">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
