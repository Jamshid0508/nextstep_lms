import { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, message, Space } from 'antd';
import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '../../api/client';

interface TeacherScheduleRecord {
  _id: string;
  groupId?: { _id?: string; name?: string };
  teacherId?: { _id?: string; fullName?: string };
  weekDays?: string[];
  startTime?: string;
  endTime?: string;
  startDate?: string;
  notes?: string;
}

export function SchedulesPage() {
  const [schedules, setSchedules] = useState<TeacherScheduleRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: TeacherScheduleRecord[] }>('/teacher/schedules');
      setSchedules(data.data ?? []);
    } catch {
      message.error("Dars jadvallarini yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSchedules();
  }, []);

  return (
    <Card title={<span><CalendarOutlined style={{ color: '#722ed1', marginRight: 8 }} /> Mening Dars Jadvalim</span>}>
      <Table
        rowKey="_id"
        dataSource={schedules}
        loading={loading}
        locale={{ emptyText: "Dars jadvali topilmadi" }}
        columns={[
          {
            title: 'Guruh',
            render: (_: unknown, record: TeacherScheduleRecord) => (
              <Typography.Text strong style={{ fontSize: 15, color: '#722ed1' }}>
                {record.groupId?.name || '—'}
              </Typography.Text>
            ),
          },
          {
            title: 'Dars kunlari',
            render: (_: unknown, record: TeacherScheduleRecord) => (
              <Space wrap>
                {record.weekDays?.map((day) => (
                  <Tag key={day} color="purple" style={{ fontWeight: 600 }}>
                    {day}
                  </Tag>
                ))}
              </Space>
            ),
          },
          {
            title: 'Vaqti',
            render: (_: unknown, record: TeacherScheduleRecord) => (
              <Typography.Text type="secondary" style={{ fontWeight: 600 }}>
                <ClockCircleOutlined /> {record.startTime || '-'} — {record.endTime || '-'}
              </Typography.Text>
            ),
          },
          {
            title: 'Boshlanish sanasi',
            render: (_: unknown, record: TeacherScheduleRecord) =>
              record.startDate ? dayjs(record.startDate).format('DD.MM.YYYY') : '—',
          },
        ]}
      />
    </Card>
  );
}
