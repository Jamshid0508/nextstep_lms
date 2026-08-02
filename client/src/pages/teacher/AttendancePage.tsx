import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
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
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  LeftOutlined,
  RightOutlined,
  SaveOutlined,
  SearchOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '../../api/client';

interface StudentInfo {
  _id: string;
  fullName: string;
  phone?: string;
}

interface TeacherGroupRecord {
  _id: string;
  name: string;
  studentIds?: StudentInfo[];
}

interface ScheduleRecord {
  _id: string;
  weekDays?: string[];
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  note?: string;
}

interface AttendanceEntry {
  _id?: string;
  lessonDate: string;
  records: AttendanceRecord[];
  notes?: string;
}

interface GroupAttendanceDetails {
  group: TeacherGroupRecord;
  schedule?: ScheduleRecord;
  attendances: AttendanceEntry[];
  month: number;
  year: number;
}

const MONTH_LABELS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

const WEEKDAY_INDEX: Record<string, number> = {
  MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 0,
};

function normalizeWeekDay(dayStr?: string): string {
  if (!dayStr) return '';
  return dayStr.trim().toUpperCase();
}

function getDaysInMonth(year: number, month: number): dayjs.Dayjs[] {
  const count = dayjs().year(year).month(month).daysInMonth();
  const dates: dayjs.Dayjs[] = [];
  for (let d = 1; d <= count; d += 1) {
    dates.push(dayjs().year(year).month(month).date(d));
  }
  return dates;
}

function getInitials(name?: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export function AttendancePage() {
  const [groups, setGroups] = useState<TeacherGroupRecord[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [month, setMonth] = useState(dayjs().month());
  const [year, setYear] = useState(dayjs().year());
  const [details, setDetails] = useState<GroupAttendanceDetails | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [lessonNote, setLessonNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  // Load Teacher Groups
  useEffect(() => {
    apiClient
      .get<{ success: true; data: TeacherGroupRecord[] }>('/teacher/groups')
      .then(({ data }) => {
        const list = data.data ?? [];
        setGroups(list);
        if (list.length > 0 && !selectedGroupId) {
          setSelectedGroupId(list[0]._id);
        }
      })
      .catch(() => message.error("Guruhlarni yuklashda xatolik yuz berdi"));
  }, []);

  // Load Attendance Details when group or month/year changes
  const fetchGroupDetails = async () => {
    if (!selectedGroupId) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ success: true; data: GroupAttendanceDetails }>(
        `/teacher/attendance/group/${selectedGroupId}?month=${month}&year=${year}`,
      );
      setDetails(data.data);
    } catch {
      message.error("Davomat ma'lumotlarini yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchGroupDetails();
  }, [selectedGroupId, month, year]);

  // Schedule filtering
  const allDaysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);

  const activeDaysInMonth = useMemo(() => {
    const weekDays = details?.schedule?.weekDays;
    if (!weekDays || weekDays.length === 0) return allDaysInMonth;

    const allowedIndices = weekDays.map((d) => WEEKDAY_INDEX[normalizeWeekDay(d)]).filter((v) => v !== undefined);
    return allDaysInMonth.filter((date) => allowedIndices.includes(date.day()));
  }, [allDaysInMonth, details?.schedule?.weekDays]);

  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceEntry>();
    (details?.attendances ?? []).forEach((att) => {
      const key = dayjs(att.lessonDate).format('YYYY-MM-DD');
      map.set(key, att);
    });
    return map;
  }, [details?.attendances]);

  // Open Marking Modal for specific Date
  const handleOpenMarkModal = (date: dayjs.Dayjs) => {
    if (!details?.group) return;
    setSelectedDate(date);

    const dateKey = date.format('YYYY-MM-DD');
    const existing = attendanceMap.get(dateKey);
    const students = details.group.studentIds ?? [];

    if (existing && existing.records?.length) {
      setRecords(
        students.map((student) => {
          const found = existing.records.find((r) => String((r.studentId as any)?._id || r.studentId) === String(student._id));
          return {
            studentId: student._id,
            status: found?.status || 'present',
            note: found?.note || '',
          };
        }),
      );
      setLessonNote(existing.notes || '');
    } else {
      setRecords(
        students.map((student) => ({
          studentId: student._id,
          status: 'present',
          note: '',
        })),
      );
      setLessonNote('');
    }

    setSearchQuery('');
    setModalOpen(true);
  };

  // Status changes inside modal
  const handleSingleStatusChange = (studentId: string, status: AttendanceRecord['status']) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r)),
    );
  };

  const handleBulkSetStatus = (status: AttendanceRecord['status']) => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, note } : r)),
    );
  };

  // Save Attendance
  const handleSaveAttendance = async () => {
    if (!selectedGroupId || !selectedDate) return;
    setSaving(true);
    try {
      await apiClient.post('/teacher/attendance', {
        groupId: selectedGroupId,
        lessonDate: selectedDate.format('YYYY-MM-DD'),
        records,
        notes: lessonNote,
      });
      message.success("Davomat saqlandi!");
      setModalOpen(false);
      await fetchGroupDetails();
    } catch {
      message.error("Davomatni saqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const students = details?.group?.studentIds ?? [];
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) => s.fullName?.toLowerCase().includes(q) || s.phone?.includes(q),
    );
  }, [students, searchQuery]);

  const counters = useMemo(() => {
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const excused = records.filter((r) => r.status === 'excused').length;
    return { present, absent, late, excused, total: records.length };
  }, [records]);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <Card title={<span><UsergroupAddOutlined style={{ color: '#722ed1', marginRight: 8 }} /> Davomat va Yo'qlama Olisb</span>}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={10}>
            <Form.Item label={<Typography.Text strong>GURUH</Typography.Text>} style={{ margin: 0 }}>
              <Select
                showSearch
                placeholder="Guruhni tanlang"
                optionFilterProp="label"
                value={selectedGroupId || undefined}
                onChange={(val) => setSelectedGroupId(val)}
                style={{ width: '100%' }}
                size="large"
                options={groups.map((g) => ({ value: g._id, label: g.name }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={14} style={{ textAlign: 'right' }}>
            <Space style={{ marginTop: 24 }}>
              <Button icon={<LeftOutlined />} onClick={() => setMonth((m) => (m === 0 ? 11 : m - 1))} />
              <Typography.Title level={4} style={{ margin: 0, paddingInline: 8 }}>
                {MONTH_LABELS[month]} {year}
              </Typography.Title>
              <Button icon={<RightOutlined />} onClick={() => setMonth((m) => (m === 11 ? 0 : m + 1))} />
              <Button onClick={() => { setMonth(dayjs().month()); setYear(dayjs().year()); }}>Bugun</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Calendar Days Cards Grid */}
      <Card title={`Dars Kunlari (${activeDaysInMonth.length} ta dars)`} loading={loading}>
        <Row gutter={[12, 12]}>
          {activeDaysInMonth.map((date) => {
            const dateKey = date.format('YYYY-MM-DD');
            const entry = attendanceMap.get(dateKey);
            const isToday = dateKey === dayjs().format('YYYY-MM-DD');

            const presentCount = entry?.records?.filter((r) => r.status === 'present').length ?? 0;
            const totalCount = entry?.records?.length ?? 0;

            return (
              <Col xs={12} sm={8} md={6} lg={4} key={dateKey}>
                <Card
                  hoverable
                  onClick={() => handleOpenMarkModal(date)}
                  style={{
                    borderRadius: 12,
                    textAlign: 'center',
                    border: isToday ? '2px solid #722ed1' : entry ? '1px solid #b7eb8f' : '1px solid #f0f0f0',
                    background: isToday ? '#f9f0ff' : entry ? '#f6ffed' : '#fff',
                  }}
                  bodyStyle={{ padding: 12 }}
                >
                  <Typography.Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', display: 'block' }}>
                    {date.format('dddd')}
                  </Typography.Text>
                  <Typography.Title level={3} style={{ margin: '4px 0', color: isToday ? '#722ed1' : undefined }}>
                    {date.date()}
                  </Typography.Title>
                  <Typography.Text style={{ fontSize: 12 }}>
                    {MONTH_LABELS[date.month()]}
                  </Typography.Text>

                  <div style={{ marginTop: 8 }}>
                    {entry ? (
                      <Tag color="green">
                        ✔ {presentCount} / {totalCount} bor
                      </Tag>
                    ) : (
                      <Tag color="default">Yo'qlama qilinmagan</Tag>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* Marking Attendance Modal */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={800}
        style={{ top: 20 }}
        bodyStyle={{ padding: 24, borderRadius: 16 }}
      >
        {selectedDate && details?.group && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  <CalendarOutlined style={{ color: '#722ed1', marginRight: 8 }} />
                  "{details.group.name}" — {selectedDate.format('DD.MM.YYYY')} Yo'qlama
                </Typography.Title>
                <Typography.Text type="secondary">
                  Talabalarning darsdagi ishtirokini belgilang va saqlang.
                </Typography.Text>
              </div>

              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={handleSaveAttendance}
                style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', borderRadius: 8, height: 40, fontWeight: 600 }}
              >
                Saqlash
              </Button>
            </div>

            {/* Bulk actions bar */}
            <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 12, padding: 12, marginBottom: 16 }}>
              <Row gutter={[12, 12]} align="middle" justify="space-between">
                <Col xs={24} md={14}>
                  <Space wrap size="small">
                    <Typography.Text type="secondary" style={{ fontSize: 11, fontWeight: 700 }}>BARCHASINI BELGILASH:</Typography.Text>
                    <Button size="small" style={{ borderRadius: 6, borderColor: '#b7eb8f', color: '#389e0d', background: '#f6ffed' }} icon={<CheckCircleOutlined />} onClick={() => handleBulkSetStatus('present')}>✔ Bor</Button>
                    <Button size="small" style={{ borderRadius: 6, borderColor: '#ffa39e', color: '#cf1322', background: '#fff1f0' }} icon={<CloseCircleOutlined />} onClick={() => handleBulkSetStatus('absent')}>✖ Yo'q</Button>
                    <Button size="small" style={{ borderRadius: 6, borderColor: '#ffe58f', color: '#d48806', background: '#fffbe6' }} icon={<ClockCircleOutlined />} onClick={() => handleBulkSetStatus('late')}>⏰ Kechikdi</Button>
                    <Button size="small" style={{ borderRadius: 6, borderColor: '#91d5ff', color: '#0958d9', background: '#e6f7ff' }} icon={<FileTextOutlined />} onClick={() => handleBulkSetStatus('excused')}>📝 Sababli</Button>
                  </Space>
                </Col>
                <Col xs={24} md={10}>
                  <Input placeholder="Qidirish..." prefix={<SearchOutlined />} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} allowClear style={{ borderRadius: 8 }} />
                </Col>
              </Row>
            </div>

            {/* Counter Summary Pills */}
            <div style={{ marginBottom: 16 }}>
              <Space wrap size="middle">
                <Tag color="green">✔ Bor: {counters.present}</Tag>
                <Tag color="red">✖ Yo'q: {counters.absent}</Tag>
                <Tag color="warning">⏰ Kechikdi: {counters.late}</Tag>
                <Tag color="processing">📝 Sababli: {counters.excused}</Tag>
                <Tag color="default">Jami: {counters.total}</Tag>
              </Space>
            </div>

            {/* Students Table */}
            {filteredStudents.length === 0 ? (
              <Alert type="warning" showIcon message="Guruhda o'quvchilar topilmadi" style={{ borderRadius: 8 }} />
            ) : (
              <Table
                rowKey="_id"
                dataSource={filteredStudents}
                pagination={false}
                size="middle"
                columns={[
                  { title: '№', render: (_: unknown, __: unknown, idx: number) => idx + 1, width: 50 },
                  {
                    title: "O'quvchi",
                    render: (_: unknown, student: StudentInfo) => (
                      <Space size="middle">
                        <Avatar style={{ backgroundColor: '#722ed1' }}>{getInitials(student.fullName)}</Avatar>
                        <div>
                          <Typography.Text strong style={{ display: 'block' }}>{student.fullName}</Typography.Text>
                          {student.phone && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{student.phone}</Typography.Text>}
                        </div>
                      </Space>
                    ),
                  },
                  {
                    title: 'Holati',
                    width: 240,
                    render: (_: unknown, student: StudentInfo) => {
                      const rec = records.find((r) => r.studentId === student._id);
                      const currentStatus = rec?.status || 'present';

                      return (
                        <Space size={6}>
                          <Button
                            shape="circle"
                            style={{
                              backgroundColor: currentStatus === 'present' ? '#52c41a' : '#f5f5f5',
                              borderColor: currentStatus === 'present' ? '#52c41a' : '#d9d9d9',
                              color: currentStatus === 'present' ? '#fff' : '#8c8c8c',
                            }}
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleSingleStatusChange(student._id, 'present')}
                          />
                          <Button
                            shape="circle"
                            style={{
                              backgroundColor: currentStatus === 'absent' ? '#ff4d4f' : '#f5f5f5',
                              borderColor: currentStatus === 'absent' ? '#ff4d4f' : '#d9d9d9',
                              color: currentStatus === 'absent' ? '#fff' : '#8c8c8c',
                            }}
                            icon={<CloseCircleOutlined />}
                            onClick={() => handleSingleStatusChange(student._id, 'absent')}
                          />
                          <Button
                            shape="circle"
                            style={{
                              backgroundColor: currentStatus === 'late' ? '#faad14' : '#f5f5f5',
                              borderColor: currentStatus === 'late' ? '#faad14' : '#d9d9d9',
                              color: currentStatus === 'late' ? '#fff' : '#8c8c8c',
                            }}
                            icon={<ClockCircleOutlined />}
                            onClick={() => handleSingleStatusChange(student._id, 'late')}
                          />
                          <Button
                            shape="circle"
                            style={{
                              backgroundColor: currentStatus === 'excused' ? '#1890ff' : '#f5f5f5',
                              borderColor: currentStatus === 'excused' ? '#1890ff' : '#d9d9d9',
                              color: currentStatus === 'excused' ? '#fff' : '#8c8c8c',
                            }}
                            icon={<FileTextOutlined />}
                            onClick={() => handleSingleStatusChange(student._id, 'excused')}
                          />
                        </Space>
                      );
                    },
                  },
                  {
                    title: 'Izoh',
                    render: (_: unknown, student: StudentInfo) => {
                      const rec = records.find((r) => r.studentId === student._id);
                      return (
                        <Input
                          placeholder="Izoh..."
                          value={rec?.note || ''}
                          onChange={(e) => handleNoteChange(student._id, e.target.value)}
                        />
                      );
                    },
                  },
                ]}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
