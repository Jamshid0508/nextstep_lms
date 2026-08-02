import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  PlusOutlined,
  UsergroupAddOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  SaveOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { apiClient } from '../api/client';

interface StudentInfo {
  _id: string;
  fullName: string;
  phone?: string;
  email?: string;
}

interface GroupRecord {
  _id: string;
  name: string;
  courseId?: { _id?: string; name?: string; price?: number };
  teacherId?: { _id?: string; fullName?: string };
  branchId?: { _id?: string; name?: string };
  studentIds?: StudentInfo[] | string[];
  room?: string;
  maxStudents?: number;
  status: 'active' | 'inactive' | 'completed';
}

interface ReferenceData {
  branches: Array<{ _id: string; name: string }>;
  courses: Array<{ _id: string; name: string }>;
  teachers: Array<{ _id: string; fullName: string }>;
  students: Array<{ _id: string; fullName: string; phone?: string }>;
}

function getInitials(name: string) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function GroupsPage() {
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [references, setReferences] = useState<ReferenceData>({ branches: [], courses: [], teachers: [], students: [] });
  const [loading, setLoading] = useState<boolean>(false);

  // Group Create/Edit Modal State
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] = useState<GroupRecord | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [form] = Form.useForm();

  // Student Assignment Modal State
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [selectedGroupForAssign, setSelectedGroupForAssign] = useState<GroupRecord | null>(null);
  const [assignedStudentIds, setAssignedStudentIds] = useState<string[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [assignSubmitting, setAssignSubmitting] = useState<boolean>(false);

  // Fetch Groups List
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: GroupRecord[] }>('/superadmin/groups');
      setGroups(data.data ?? []);
    } catch {
      message.error("Guruhlar ma’lumotlarini yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Fetch References
  const fetchReferences = async () => {
    try {
      const { data } = await apiClient.get<{ success: true; data: ReferenceData }>('/superadmin/references');
      setReferences({
        branches: data.data.branches ?? [],
        courses: data.data.courses ?? [],
        teachers: data.data.teachers ?? [],
        students: data.data.students ?? [],
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void fetchGroups();
    void fetchReferences();
  }, []);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingGroup(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active', maxStudents: 20 });
    setCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (group: GroupRecord) => {
    setEditingGroup(group);
    const sIds = Array.isArray(group.studentIds)
      ? group.studentIds.map((s) => (typeof s === 'string' ? s : s._id))
      : [];

    form.setFieldsValue({
      name: group.name,
      courseId: (group.courseId as any)?._id || group.courseId,
      teacherId: (group.teacherId as any)?._id || group.teacherId,
      branchId: (group.branchId as any)?._id || group.branchId,
      room: group.room,
      maxStudents: group.maxStudents || 20,
      status: group.status || 'active',
      studentIds: sIds,
    });
    setCreateModalOpen(true);
  };

  // Save Group (Create / Update)
  const handleSaveGroup = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingGroup) {
        await apiClient.patch(`/superadmin/groups/${editingGroup._id}`, values);
        message.success("Guruh ma'lumotlari yangilandi");
      } else {
        await apiClient.post('/superadmin/groups', values);
        message.success("Yangi guruh muvaffaqiyatli yaratildi");
      }

      setCreateModalOpen(false);
      form.resetFields();
      await fetchGroups();
    } catch {
      message.error("Guruhni saqlashda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Group
  const handleDeleteGroup = async (id: string) => {
    try {
      await apiClient.delete(`/superadmin/groups/${id}`);
      message.success("Guruh o'chirildi");
      await fetchGroups();
    } catch {
      message.error("Guruhni o'chirishda xatolik yuz berdi");
    }
  };

  // Open Assign Students Modal
  const handleOpenAssignModal = (group: GroupRecord) => {
    setSelectedGroupForAssign(group);
    const sIds = Array.isArray(group.studentIds)
      ? group.studentIds.map((s) => (typeof s === 'string' ? s : s._id))
      : [];
    setAssignedStudentIds(sIds);
    setStudentSearchQuery('');
    setAssignModalOpen(true);
  };

  // Save Assigned Students for Group
  const handleSaveAssignedStudents = async () => {
    if (!selectedGroupForAssign) return;
    setAssignSubmitting(true);
    try {
      await apiClient.patch(`/superadmin/groups/${selectedGroupForAssign._id}`, {
        studentIds: assignedStudentIds,
      });
      message.success("Guruh o'quvchilari tarkibi muvaffaqiyatli saqlandi");
      setAssignModalOpen(false);
      await fetchGroups();
    } catch {
      message.error("O'quvchilarni biriktirishda xatolik yuz berdi");
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Quick Remove Student from Assign Modal
  const handleRemoveStudentFromAssign = (studentId: string) => {
    setAssignedStudentIds((prev) => prev.filter((id) => id !== studentId));
  };

  // Quick Add Student from Select
  const handleAddStudentToAssign = (studentId: string) => {
    if (!assignedStudentIds.includes(studentId)) {
      setAssignedStudentIds((prev) => [...prev, studentId]);
    }
  };

  // Full Details of Currently Assigned Students
  const assignedStudentsList = useMemo(() => {
    return references.students.filter((s) => assignedStudentIds.includes(s._id));
  }, [references.students, assignedStudentIds]);

  // Unassigned Students for Dropdown Select
  const unassignedStudentsOptions = useMemo(() => {
    return references.students
      .filter((s) => !assignedStudentIds.includes(s._id))
      .map((s) => ({
        value: s._id,
        label: `${s.fullName} (${s.phone || 'Telefon yo\'q'})`,
      }));
  }, [references.students, assignedStudentIds]);

  // Filtered assigned students list by search
  const filteredAssignedStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return assignedStudentsList;
    const q = studentSearchQuery.toLowerCase();
    return assignedStudentsList.filter(
      (s) => s.fullName.toLowerCase().includes(q) || (s.phone && s.phone.toLowerCase().includes(q)),
    );
  }, [assignedStudentsList, studentSearchQuery]);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Top Header Card */}
      <Card bodyStyle={{ padding: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Typography.Title level={3} style={{ margin: 0 }}>
              <UsergroupAddOutlined style={{ color: '#722ed1', marginRight: 10 }} />
              Guruhlar Boshqaruvi
            </Typography.Title>
          </Col>
          <Col>
            <Space wrap>
              <Button icon={<ReloadOutlined />} onClick={() => void fetchGroups()} style={{ borderRadius: 8 }}>
                Yangilash
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ borderRadius: 8, backgroundColor: '#722ed1', borderColor: '#722ed1', fontWeight: 600 }}
                onClick={handleOpenCreate}
              >
                Yangi Guruh Qo'shish
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Groups Table */}
      <Card bodyStyle={{ padding: 0 }} style={{ overflow: 'hidden', borderRadius: 16 }}>
        <Table
          rowKey="_id"
          dataSource={groups}
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: "Guruhlar topilmadi" }}
          columns={[
            {
              title: 'Guruh Nomi',
              dataIndex: 'name',
              render: (name: string, record: GroupRecord) => (
                <div>
                  <Typography.Text strong style={{ fontSize: 15, display: 'block' }}>
                    {name}
                  </Typography.Text>
                  {record.room && (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Xona: {record.room}
                    </Typography.Text>
                  )}
                </div>
              ),
            },
            {
              title: 'Kurs',
              dataIndex: 'courseId',
              render: (val: unknown) => (
                <Tag color="purple" style={{ borderRadius: 6, fontWeight: 600 }}>
                  {(val as any)?.name || '—'}
                </Tag>
              ),
            },
            {
              title: "O'qituvchi",
              dataIndex: 'teacherId',
              render: (val: unknown) => (
                <Space>
                  <UserOutlined style={{ color: '#1890ff' }} />
                  <Typography.Text>{(val as any)?.fullName || '—'}</Typography.Text>
                </Space>
              ),
            },
            {
              title: 'Filial',
              dataIndex: 'branchId',
              render: (val: unknown) => (val as any)?.name || '—',
            },
            {
              title: 'Biriktirilgan Talabalar',
              render: (_: unknown, record: GroupRecord) => {
                const sCount = Array.isArray(record.studentIds) ? record.studentIds.length : 0;
                const max = record.maxStudents || 20;

                return (
                  <Space direction="vertical" size={2}>
                    <Badge
                      status={sCount >= max ? 'error' : sCount > 0 ? 'success' : 'default'}
                      text={
                        <Typography.Text strong style={{ fontSize: 13 }}>
                          {sCount} / {max} ta o'quvchi
                        </Typography.Text>
                      }
                    />
                    <Button
                      type="link"
                      size="small"
                      icon={<UsergroupAddOutlined />}
                      style={{ padding: 0, fontWeight: 600, color: '#722ed1' }}
                      onClick={() => handleOpenAssignModal(record)}
                    >
                      O'quvchilarni biriktirish
                    </Button>
                  </Space>
                );
              },
            },
            {
              title: 'Holat',
              dataIndex: 'status',
              render: (status: string) => {
                let color = 'green';
                let label = 'Faol';
                if (status === 'inactive') {
                  color = 'default';
                  label = 'Nofaol';
                } else if (status === 'completed') {
                  color = 'blue';
                  label = 'Yakunlangan';
                }
                return <Tag color={color}>{label}</Tag>;
              },
            },
            {
              title: 'Harakatlar',
              key: 'actions',
              render: (_: unknown, record: GroupRecord) => (
                <Space size="middle">
                  <Button
                    type="primary"
                    size="small"
                    style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', borderRadius: 6, fontWeight: 600 }}
                    icon={<UsergroupAddOutlined />}
                    onClick={() => handleOpenAssignModal(record)}
                  >
                    Talabalar
                  </Button>

                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    style={{ borderRadius: 6 }}
                    onClick={() => handleOpenEdit(record)}
                  >
                    Tahrirlash
                  </Button>

                  <Popconfirm
                    title="Guruhni o'chirishni tasdiqlaysizmi?"
                    okText="Ha"
                    cancelText="Yo'q"
                    onConfirm={() => handleDeleteGroup(record._id)}
                  >
                    <Button danger size="small" icon={<DeleteOutlined />} style={{ borderRadius: 6 }}>
                      O'chirish
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {/* O'QUVCHILARNI BIRIKTIRISH MODALI (Manage Students Modal) */}
      <Modal
        open={assignModalOpen}
        onCancel={() => setAssignModalOpen(false)}
        footer={null}
        width={750}
        style={{ top: 30 }}
        bodyStyle={{ padding: 24, borderRadius: 16 }}
      >
        {selectedGroupForAssign && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  <UsergroupAddOutlined style={{ color: '#722ed1', marginRight: 8 }} />
                  "{selectedGroupForAssign.name}" — O'quvchilarni Biriktirish
                </Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  Guruhga yangi talabalarni qo'shing yoki mavjudlarini guruhdan chiqarib tashlang.
                </Typography.Text>
              </div>

              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={assignSubmitting}
                onClick={handleSaveAssignedStudents}
                style={{
                  backgroundColor: '#722ed1',
                  borderColor: '#722ed1',
                  borderRadius: 8,
                  height: 40,
                  paddingInline: 20,
                  fontWeight: 600,
                }}
              >
                Saqlash
              </Button>
            </div>

            {/* Student Picker Input */}
            <Card size="small" style={{ marginBottom: 16, background: '#fafafa', borderRadius: 12 }}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
                + YANGI O'QUVCHI QO'SHISH (RO'YXATDAN TANLANG):
              </Typography.Text>

              <Select
                showSearch
                placeholder="O'quvchi ismini yoki telefonini qidiring va tanlang..."
                optionFilterProp="label"
                value={null}
                onChange={(val) => {
                  if (val) handleAddStudentToAssign(val);
                }}
                style={{ width: '100%' }}
                size="large"
                options={unassignedStudentsOptions}
                notFoundContent="Qo'shish uchun boshqa o'quvchilar topilmadi"
              />
            </Card>

            {/* Filter and Stats Bar */}
            <Row gutter={[12, 12]} align="middle" justify="space-between" style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12}>
                <Space>
                  <Tag color="purple" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 12, fontWeight: 600 }}>
                    Jami biriktirilgan: {assignedStudentIds.length} / {selectedGroupForAssign.maxStudents || 20} ta
                  </Tag>
                </Space>
              </Col>
              <Col xs={24} sm={12}>
                <Input
                  placeholder="Guruhdagi talabalarni qidirish..."
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  allowClear
                  style={{ borderRadius: 8 }}
                />
              </Col>
            </Row>

            {/* Assigned Students List Table */}
            <Table
              rowKey="_id"
              dataSource={filteredAssignedStudents}
              pagination={false}
              size="middle"
              locale={{ emptyText: "Ushbu guruhga hali o'quvchilar biriktirilmagan" }}
              columns={[
                {
                  title: '№',
                  render: (_: unknown, __: unknown, idx: number) => idx + 1,
                  width: 50,
                },
                {
                  title: "O'quvchi",
                  render: (_: unknown, student: ReferenceData['students'][0]) => (
                    <Space size="middle">
                      <Avatar style={{ backgroundColor: '#722ed1', fontWeight: 600 }}>
                        {getInitials(student.fullName)}
                      </Avatar>
                      <div>
                        <Typography.Text strong style={{ display: 'block', fontSize: 14 }}>
                          {student.fullName}
                        </Typography.Text>
                        {student.phone && (
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {student.phone}
                          </Typography.Text>
                        )}
                      </div>
                    </Space>
                  ),
                },
                {
                  title: 'Harakat',
                  width: 160,
                  render: (_: unknown, student: ReferenceData['students'][0]) => (
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      style={{ borderRadius: 6 }}
                      onClick={() => handleRemoveStudentFromAssign(student._id)}
                    >
                      Chiqarib tashlash
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Modal>

      {/* CREATE / EDIT GROUP MODAL */}
      <Modal
        open={createModalOpen}
        title={editingGroup ? "Guruhni Tahrirlash" : "Yangi Guruh Yaratish"}
        onCancel={() => {
          setCreateModalOpen(false);
          form.resetFields();
        }}
        onOk={handleSaveGroup}
        okText="Saqlash"
        confirmLoading={submitting}
        width={650}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Guruh nomi" rules={[{ required: true, message: 'Guruh nomini kiriting' }]}>
            <Input placeholder="Masalan: IELTS Intensive 7.0" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="courseId" label="Kurs" rules={[{ required: true, message: 'Kursni tanlang' }]}>
                <Select
                  showSearch
                  placeholder="Kursni tanlang"
                  optionFilterProp="label"
                  options={references.courses.map((item) => ({ value: item._id, label: item.name }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="teacherId" label="O'qituvchi">
                <Select
                  showSearch
                  allowClear
                  placeholder="O'qituvchini tanlang"
                  optionFilterProp="label"
                  options={references.teachers.map((item) => ({ value: item._id, label: item.fullName }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="branchId" label="Filial" rules={[{ required: true, message: 'Filialni tanlang' }]}>
                <Select
                  showSearch
                  placeholder="Filialni tanlang"
                  optionFilterProp="label"
                  options={references.branches.map((item) => ({ value: item._id, label: item.name }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="room" label="Xona">
                <Input placeholder="Masalan: 3-xona" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="maxStudents" label="Maksimal o'quvchi soni">
                <InputNumber min={1} style={{ width: '100%' }} placeholder="20" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Holat" initialValue="active">
                <Select
                  options={[
                    { value: 'active', label: 'Faol' },
                    { value: 'inactive', label: 'Nofaol' },
                    { value: 'completed', label: 'Yakunlangan' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Student Multi-Select in Group Creation */}
          <Form.Item name="studentIds" label="Guruh o'quvchilarini biriktirish (Tanlash ixtiyoriy)">
            <Select
              mode="multiple"
              showSearch
              placeholder="O'quvchilarni tanlang..."
              optionFilterProp="label"
              options={references.students.map((s) => ({
                value: s._id,
                label: `${s.fullName} (${s.phone || 'Telefon yo\'q'})`,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
