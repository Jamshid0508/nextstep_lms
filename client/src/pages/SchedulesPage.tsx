import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  ReloadOutlined,
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '../api/client';

interface ScheduleRecord {
  _id: string;
  groupId?: { _id?: string; name?: string };
  teacherId?: { _id?: string; fullName?: string };
  weekDays?: string[];
  startTime?: string;
  endTime?: string;
  startDate?: string;
  notes?: string;
}

interface ReferenceData {
  groups: Array<{ _id: string; name: string }>;
  teachers: Array<{ _id: string; fullName: string }>;
}

const MONTH_LABELS = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'Iyun',
  'Iyul',
  'Avgust',
  'Sentabr',
  'Oktabr',
  'Noyabr',
  'Dekabr',
];

const DAY_LABELS = ['D', 'S', 'C', 'P', 'J', 'S', 'Y'];

const WEEKDAY_INDEX: Record<string, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 0,
};

const weekDaysOptions = [
  { value: 'MONDAY', label: 'Dushanba (Du)' },
  { value: 'TUESDAY', label: 'Seshanba (Se)' },
  { value: 'WEDNESDAY', label: 'Chorshanba (Cho)' },
  { value: 'THURSDAY', label: 'Payshanba (Pa)' },
  { value: 'FRIDAY', label: 'Juma (Ju)' },
  { value: 'SATURDAY', label: 'Shanba (Sha)' },
  { value: 'SUNDAY', label: 'Yakshanba (Yak)' },
];

function getMonthCells(year: number, month: number) {
  const start = dayjs(new Date(year, month, 1));
  const totalDays = start.daysInMonth();
  const startIndex = (start.day() + 6) % 7;
  return Array.from({ length: 42 }, (_, idx) => {
    const day = idx - startIndex + 1;
    return day >= 1 && day <= totalDays ? start.date(day) : null;
  });
}

function normalizeWeekDay(value: string) {
  return String(value ?? '').trim().toUpperCase();
}

function isScheduleOnDate(schedule: ScheduleRecord, date: dayjs.Dayjs) {
  if (schedule.startDate && dayjs(schedule.startDate).isSame(date, 'day')) {
    return true;
  }

  const weekday = date.day();
  return schedule.weekDays?.some((day) => WEEKDAY_INDEX[normalizeWeekDay(day)] === weekday) ?? false;
}

export function SchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [references, setReferences] = useState<ReferenceData>({ groups: [], teachers: [] });
  const [loading, setLoading] = useState(false);

  const [year, setYear] = useState(dayjs().year());
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'month' | 'year' | 'list'>('year');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Load References
  const fetchReferences = async () => {
    try {
      const { data } = await apiClient.get<{ success: true; data: ReferenceData }>('/superadmin/references');
      setReferences({
        groups: data.data.groups ?? [],
        teachers: data.data.teachers ?? [],
      });
    } catch {
      // ignore
    }
  };

  // Load Schedules
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: ScheduleRecord[] }>('/superadmin/schedules');
      setSchedules(data.data ?? []);
    } catch {
      message.error("Dars jadvallarini yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReferences();
    void fetchSchedules();
  }, []);

  // Filtered Schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      const gId = (schedule.groupId as any)?._id || schedule.groupId;
      const tId = (schedule.teacherId as any)?._id || schedule.teacherId;

      const groupMatches = !selectedGroupId || String(gId) === selectedGroupId;
      const teacherMatches = !selectedTeacherId || String(tId) === selectedTeacherId;

      return groupMatches && teacherMatches;
    });
  }, [schedules, selectedGroupId, selectedTeacherId]);

  const scheduleMap = useMemo(() => {
    const map = new Map<string, ScheduleRecord[]>();

    filteredSchedules.forEach((schedule) => {
      for (let month = 0; month < 12; month += 1) {
        getMonthCells(year, month).forEach((date) => {
          if (!date) return;
          if (isScheduleOnDate(schedule, date)) {
            const key = date.format('YYYY-MM-DD');
            map.set(key, [...(map.get(key) ?? []), schedule]);
          }
        });
      }
    });

    return map;
  }, [filteredSchedules, year]);

  const todayKey = dayjs().format('YYYY-MM-DD');

  // Handle Create Schedule
  const handleCreateSchedule = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await apiClient.post('/superadmin/schedules', values);
      message.success("Yangisiz dars jadvali muvaffaqiyatli qo'shildi");
      form.resetFields();
      setModalOpen(false);
      await fetchSchedules();
    } catch {
      message.error("Jadvalni saqlashda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Schedule
  const handleDeleteSchedule = async (id: string) => {
    try {
      await apiClient.delete(`/superadmin/schedules/${id}`);
      message.success("Dars jadvali o'chirildi");
      await fetchSchedules();
    } catch {
      message.error("Dars jadvalini o'chirishda xatolik yuz berdi");
    }
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Top Header Card */}
      <Card style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 24 }} bodyStyle={{ padding: 24 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Typography.Title level={3} style={{ margin: 0 }}>
              <CalendarOutlined style={{ color: '#722ed1', marginRight: 10 }} />
              Dars jadvali
            </Typography.Title>
          </Col>
          <Col>
            <Space wrap>
              {['year', 'list'].map((mode) => (
                <Button
                  key={mode}
                  type={viewMode === mode ? 'primary' : 'default'}
                  onClick={() => setViewMode(mode as typeof viewMode)}
                  style={{ borderRadius: 8, fontWeight: 600 }}
                >
                  {mode === 'year' ? 'Yillik ko‘rinish' : "Ro'yxat bo'yicha"}
                </Button>
              ))}
              <Button icon={<ReloadOutlined />} onClick={() => void fetchSchedules()} style={{ borderRadius: 8 }}>
                Yangilash
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ borderRadius: 8, backgroundColor: '#722ed1', borderColor: '#722ed1', fontWeight: 600 }}
                onClick={() => setModalOpen(true)}
              >
                Jadval qo‘shish
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Filter Bar with Select Dropdowns */}
        <Row gutter={[16, 16]} align="middle">
          {/* Guruh Select */}
          <Col xs={24} md={8}>
            <Form.Item label={<Typography.Text strong>GURUH</Typography.Text>} style={{ margin: 0 }}>
              <Select
                showSearch
                allowClear
                placeholder="Barcha guruhlar"
                optionFilterProp="label"
                value={selectedGroupId || undefined}
                onChange={(val) => setSelectedGroupId(val || '')}
                style={{ width: '100%' }}
                size="large"
                options={[
                  { value: '', label: 'Barcha guruhlar' },
                  ...references.groups.map((g) => ({ value: g._id, label: g.name })),
                ]}
              />
            </Form.Item>
          </Col>

          {/* O'qituvchi Select */}
          <Col xs={24} md={8}>
            <Form.Item label={<Typography.Text strong>O'QITUVCHI</Typography.Text>} style={{ margin: 0 }}>
              <Select
                showSearch
                allowClear
                placeholder="Barcha o'qituvchilar"
                optionFilterProp="label"
                value={selectedTeacherId || undefined}
                onChange={(val) => setSelectedTeacherId(val || '')}
                style={{ width: '100%' }}
                size="large"
                options={[
                  { value: '', label: "Barcha o'qituvchilar" },
                  ...references.teachers.map((t) => ({ value: t._id, label: t.fullName })),
                ]}
              />
            </Form.Item>
          </Col>

          {/* Year Controls */}
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space style={{ marginTop: 24 }}>
              <Button icon={<LeftOutlined />} onClick={() => setYear((y) => y - 1)} style={{ borderRadius: 8 }} />
              <Typography.Title level={4} style={{ margin: 0, paddingInline: 8 }}>
                {year}
              </Typography.Title>
              <Button icon={<RightOutlined />} onClick={() => setYear((y) => y + 1)} style={{ borderRadius: 8 }} />
              <Button type="default" onClick={() => setYear(dayjs().year())} style={{ borderRadius: 8 }}>
                Bugun
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Year View Calendar */}
      {viewMode === 'year' && (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 12 }, (_, monthIndex) => {
            const cells = getMonthCells(year, monthIndex);
            return (
              <Col key={monthIndex} xs={24} sm={12} lg={8} xl={6}>
                <Card
                  style={{ borderRadius: 20, minHeight: 320, background: '#fff' }}
                  bodyStyle={{ padding: 16 }}
                  title={
                    <Typography.Text strong style={{ fontSize: 16, color: '#722ed1' }}>
                      {MONTH_LABELS[monthIndex]}
                    </Typography.Text>
                  }
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 10, textAlign: 'center' }}>
                    {DAY_LABELS.map((label) => (
                      <Typography.Text key={label} type="secondary" style={{ fontSize: 12, fontWeight: 700 }}>
                        {label}
                      </Typography.Text>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                    {cells.map((date, idx) => {
                      if (!date) {
                        return <div key={idx} style={{ minHeight: 44 }} />;
                      }

                      const dateKey = date.format('YYYY-MM-DD');
                      const daySchedules = scheduleMap.get(dateKey) ?? [];
                      const isToday = dateKey === todayKey;

                      return (
                        <div
                          key={idx}
                          style={{
                            minHeight: 44,
                            borderRadius: 10,
                            padding: '4px 4px',
                            background: isToday ? '#f9f0ff' : '#fff',
                            border: isToday
                              ? '2px solid #722ed1'
                              : daySchedules.length
                              ? '1px solid #d3adf7'
                              : '1px solid #f0f0f0',
                            textAlign: 'center',
                          }}
                        >
                          <Typography.Text style={{ fontSize: 12, fontWeight: isToday ? 700 : 400 }}>
                            {date.date()}
                          </Typography.Text>
                          {daySchedules.length > 0 && (
                            <div style={{ marginTop: 2 }}>
                              <Badge
                                count={daySchedules.length}
                                style={{ backgroundColor: '#722ed1', fontSize: 10, height: 16, minWidth: 16, lineHeight: '16px' }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card title="Dars jadvallari ro'yxati" style={{ borderRadius: 20 }}>
          <Table
            rowKey="_id"
            dataSource={filteredSchedules}
            loading={loading}
            locale={{ emptyText: "Dars jadvali topilmadi" }}
            columns={[
              {
                title: 'Guruh',
                render: (_: unknown, record: ScheduleRecord) => (
                  <Typography.Text strong>{(record.groupId as any)?.name || '—'}</Typography.Text>
                ),
              },
              {
                title: "O'qituvchi",
                render: (_: unknown, record: ScheduleRecord) => (
                  <Space>
                    <UserOutlined style={{ color: '#722ed1' }} />
                    <Typography.Text>{(record.teacherId as any)?.fullName || '—'}</Typography.Text>
                  </Space>
                ),
              },
              {
                title: 'Dars kunlari',
                render: (_: unknown, record: ScheduleRecord) => (
                  <Space wrap>
                    {record.weekDays?.map((d) => (
                      <Tag key={d} color="purple">
                        {d}
                      </Tag>
                    ))}
                  </Space>
                ),
              },
              {
                title: 'Vaqti',
                render: (_: unknown, record: ScheduleRecord) => (
                  <Typography.Text type="secondary">
                    <ClockCircleOutlined /> {record.startTime || '-'} - {record.endTime || '-'}
                  </Typography.Text>
                ),
              },
              {
                title: 'Boshlanish sanasi',
                render: (_: unknown, record: ScheduleRecord) =>
                  record.startDate ? dayjs(record.startDate).format('DD.MM.YYYY') : '—',
              },
              {
                title: 'Harakatlar',
                render: (_: unknown, record: ScheduleRecord) => (
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteSchedule(record._id)}
                  >
                    O'chirish
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      )}

      {/* Create Schedule Modal */}
      <Modal
        open={modalOpen}
        title="Yangi Dars Jadvali Qo'shish"
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={handleCreateSchedule}
        okText="Saqlash"
        confirmLoading={submitting}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="groupId" label="Guruh" rules={[{ required: true, message: 'Guruhni tanlang' }]}>
            <Select
              showSearch
              placeholder="Guruhni tanlang"
              optionFilterProp="label"
              options={references.groups.map((g) => ({ value: g._id, label: g.name }))}
            />
          </Form.Item>

          <Form.Item name="teacherId" label="O'qituvchi" rules={[{ required: true, message: "O'qituvchini tanlang" }]}>
            <Select
              showSearch
              placeholder="O'qituvchini tanlang"
              optionFilterProp="label"
              options={references.teachers.map((t) => ({ value: t._id, label: t.fullName }))}
            />
          </Form.Item>

          <Form.Item name="weekDays" label="Dars kunlari" rules={[{ required: true, message: 'Dars kunlarini tanlang' }]}>
            <Select mode="multiple" placeholder="Kunlarni tanlang" options={weekDaysOptions} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startTime" label="Boshlanish vaqti (masalan: 10:00)" rules={[{ required: true, message: 'Vaqtni kiriting' }]}>
                <Input placeholder="10:00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endTime" label="Tugash vaqti (masalan: 12:00)" rules={[{ required: true, message: 'Vaqtni kiriting' }]}>
                <Input placeholder="12:00" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="startDate" label="Boshlanish sanasi">
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
