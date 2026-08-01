import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Form, Select, Table, message } from 'antd';
import { apiClient } from '../api/client';

interface ParentRelationRecord {
  _id: string;
  parentId?: string;
  studentId?: { _id?: string; fullName?: string; phone?: string };
  relationship?: string;
}

interface ReferenceData {
  parents: Array<{ _id: string; fullName: string }>;
  students: Array<{ _id: string; fullName: string }>;
}

const columns = [
  { title: 'Talaba', dataIndex: 'studentId', render: (value: unknown) => (value as any)?.fullName ?? '-' },
  { title: 'Telefon', dataIndex: 'studentId', render: (value: unknown) => (value as any)?.phone ?? '-' },
  { title: 'Bog‘lanish turi', dataIndex: 'relationship' },
];

export function ParentRelationsPage() {
  const [references, setReferences] = useState<ReferenceData>({ parents: [], students: [] });
  const [data, setData] = useState<ParentRelationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    void apiClient.get<{ success: true; data: ReferenceData }>('/superadmin/references').then(({ data }) => {
      setReferences({
        parents: data.data.parents ?? [],
        students: data.data.students ?? [],
      });
    });
  }, []);

  const loadChildren = async (selectedParentId: string) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: { children: ParentRelationRecord[] } }>(`/superadmin/parents/${selectedParentId}/children`);
      setData(data.data.children ?? []);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (formValues: { parentId: string; studentId: string; relationship?: string }) => {
    try {
      await apiClient.post(`/superadmin/parents/${formValues.parentId}/link-child`, {
        studentId: formValues.studentId,
        relationship: formValues.relationship,
      });
      message.success('Bog‘lanish saqlandi');
      form.resetFields();
      await loadChildren(formValues.parentId);
    } catch {
      message.error('Bog‘lanish saqlashda xatolik');
    }
  };

  const parentSelectOptions = useMemo(() => references.parents.map((item) => ({ value: item._id, label: item.fullName })), [references.parents]);
  const studentSelectOptions = useMemo(() => references.students.map((item) => ({ value: item._id, label: item.fullName })), [references.students]);

  return (
    <Card title="Ota-ona va talaba bog‘lanishi">
      <Form layout="vertical" form={form} onFinish={handleLink}>
        <Form.Item name="parentId" label="Ota-ona" rules={[{ required: true, message: 'Ota-ona tanlang' }]}> 
          <Select options={parentSelectOptions} onChange={(value) => void loadChildren(String(value))} />
        </Form.Item>
        <Form.Item name="studentId" label="Talaba" rules={[{ required: true, message: 'Talaba tanlang' }]}> 
          <Select options={studentSelectOptions} />
        </Form.Item>
        <Form.Item name="relationship" label="Bog‘lanish turi" initialValue="guardian">
          <Select options={[
            { value: 'father', label: 'Father' },
            { value: 'mother', label: 'Mother' },
            { value: 'guardian', label: 'Guardian' },
          ]} />
        </Form.Item>
        <Button htmlType="submit" type="primary">Bog‘lash</Button>
      </Form>

      <div style={{ marginTop: 20 }}>
        <Table rowKey="_id" columns={columns} dataSource={data} loading={loading} pagination={false} />
      </div>
    </Card>
  );
}
