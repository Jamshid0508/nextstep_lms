import { useEffect, useState } from 'react';
import { Avatar, Card, Col, Row, Space, Table, Tag, Typography, message } from 'antd';
import { BookOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { apiClient } from '../../api/client';

interface StudentInfo {
  _id: string;
  fullName: string;
  phone?: string;
  email?: string;
}

interface TeacherGroupRecord {
  _id: string;
  name: string;
  courseId?: { name?: string; price?: number };
  branchId?: { name?: string };
  room?: string;
  studentIds?: StudentInfo[];
  status?: string;
}

export function GroupsPage() {
  const [groups, setGroups] = useState<TeacherGroupRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TeacherGroupRecord | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: TeacherGroupRecord[] }>('/teacher/groups');
      setGroups(data.data ?? []);
      if (data.data.length > 0 && !selectedGroup) {
        setSelectedGroup(data.data[0]);
      }
    } catch {
      message.error("Guruhlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchGroups();
  }, []);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <Card loading={loading} title={<span><TeamOutlined style={{ color: '#722ed1', marginRight: 8 }} /> Mening Guruhlarim</span>}>
        <Row gutter={[16, 16]}>
          {groups.map((group) => (
            <Col xs={24} sm={12} md={8} key={group._id}>
              <Card
                hoverable
                style={{
                  borderRadius: 12,
                  borderColor: selectedGroup?._id === group._id ? '#722ed1' : undefined,
                  borderWidth: selectedGroup?._id === group._id ? 2 : 1,
                }}
                onClick={() => setSelectedGroup(group)}
              >
                <Typography.Title level={4} style={{ margin: 0, color: '#722ed1' }}>
                  {group.name}
                </Typography.Title>
                <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                  <BookOutlined /> Kurs: {group.courseId?.name || '—'}
                </Typography.Text>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Tag color="purple">{group.studentIds?.length || 0} ta o'quvchi</Tag>
                  <Typography.Text type="secondary">{group.room || 'Xona ko‘rsatilmagan'}</Typography.Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {selectedGroup && (
        <Card
          title={
            <span>
              <UserOutlined style={{ color: '#722ed1', marginRight: 8 }} />
              "{selectedGroup.name}" Guruhidagi O'quvchilar Ro'yxati
            </span>
          }
        >
          <Table
            rowKey="_id"
            dataSource={selectedGroup.studentIds || []}
            pagination={false}
            locale={{ emptyText: "Ushbu guruhga hali o'quvchilar biriktirilmagan" }}
            columns={[
              {
                title: '№',
                render: (_: unknown, __: unknown, idx: number) => idx + 1,
                width: 60,
              },
              {
                title: "O'quvchi F.I.Sh",
                render: (_: unknown, student: StudentInfo) => (
                  <Space size="middle">
                    <Avatar style={{ backgroundColor: '#722ed1' }}>
                      {student.fullName?.substring(0, 2).toUpperCase()}
                    </Avatar>
                    <div>
                      <Typography.Text strong style={{ display: 'block' }}>{student.fullName}</Typography.Text>
                      {student.email && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{student.email}</Typography.Text>}
                    </div>
                  </Space>
                ),
              },
              {
                title: 'Telefon raqami',
                dataIndex: 'phone',
                render: (v: string) => v || '—',
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
