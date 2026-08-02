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
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  SearchOutlined,
  CalendarOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '../api/client';

interface StudentInfo {
  _id: string;
  fullName: string;
  phone?: string;
  email?: string;
}

interface GroupInfo {
  _id: string;
  name: string;
  courseId?: { name?: string; price?: number };
  teacherId?: { fullName?: string };
  branchId?: { name?: string };
  studentIds?: StudentInfo[];
}

interface ScheduleInfo {
  weekDays?: string[];
  startTime?: string;
  endTime?: string;
  generatedLessons?: Array<{ date: string; startTime: string; endTime: String }>;
}

interface StudentAttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  note?: string;
}

interface AttendanceDoc {
  _id?: string;
  groupId: string;
  lessonDate: string;
  lessonStartTime?: string;
  lessonEndTime?: string;
  records: StudentAttendanceRecord[];
  markedBy?: { fullName?: string };
}

interface GroupAttendanceResponse {
  group: GroupInfo;
  schedule?: ScheduleInfo;
  attendances: AttendanceDoc[];
  month: number;
  year: number;
}

const weekDayNamesUz: Record<string, string> = {
  MONDAY: 'Du',
  TUESDAY: 'Se',
  WEDNESDAY: 'Cho',
  THURSDAY: 'Pa',
  FRIDAY: 'Ju',
  SATURDAY: 'Sha',
  SUNDAY: 'Yak',
};

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index,
  label: dayjs().month(index).format('MMMM'),
}));

const yearOptions = Array.from({ length: 8 }, (_, index) => {
  const yearValue = dayjs().year() - 2 + index;
  return { value: yearValue, label: String(yearValue) };
});

// Helper for initials
function getInitials(name: string) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function AttendancePage() {
  const [groups, setGroups] = useState<Array<{ _id: string; name: string }>>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(dayjs().month());
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());

  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<GroupAttendanceResponse | null>(null);

  // Modal Yo'qlama State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [activeLessonDate, setActiveLessonDate] = useState<string>('');
  const [activeStartTime, setActiveStartTime] = useState<string>('09:00');
  const [activeEndTime, setActiveEndTime] = useState<string>('11:00');

  const [records, setRecords] = useState<StudentAttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Load Group List
  useEffect(() => {
    void apiClient.get<{ success: true; data: { groups: Array<{ _id: string; name: string }> } }>('/superadmin/references').then(({ data }) => {
      const gList = data.data.groups ?? [];
      setGroups(gList);
      if (gList.length > 0) {
        setSelectedGroupId(gList[0]._id);
      }
    });
  }, []);

  // Fetch Group Attendance Details
  const fetchGroupAttendance = async (gId: string, month: number, year: number) => {
    if (!gId) return;
    setLoading(true);
    try {
      const res = await apiClient.get<{ success: true; data: GroupAttendanceResponse }>(
        `/superadmin/attendance/group/${gId}?month=${month}&year=${year}`,
      );
      setData(res.data.data);
    } catch {
      message.error('Guruh davomat ma’lumotlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGroupId) {
      void fetchGroupAttendance(selectedGroupId, selectedMonth, selectedYear);
    }
  }, [selectedGroupId, selectedMonth, selectedYear]);

  // Generate Month Lessons List
  const monthLessonsList = useMemo(() => {
    if (!data || !data.group) return [];

    const monthStart = dayjs(`${selectedYear}-${selectedMonth + 1}-01`);
    const daysInMonth = monthStart.daysInMonth();

    const sched = data.schedule;
    const startTime = sched?.startTime || '09:00';
    const endTime = sched?.endTime || '11:00';

    // Build list of lesson dates
    const lessons: Array<{
      dateStr: string;
      formattedDate: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      attendanceDoc?: AttendanceDoc;
      isMarked: boolean;
      presentCount: number;
      absentCount: number;
      lateCount: number;
      excusedCount: number;
    }> = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDate = dayjs(`${selectedYear}-${selectedMonth + 1}-${d}`);
      const dayOfWeekUpper = currentDate.format('dddd').toUpperCase(); // MONDAY...

      // Check if scheduled
      const matchesSchedule =
        sched?.weekDays?.length
          ? sched.weekDays.includes(dayOfWeekUpper)
          : currentDate.day() === 1 || currentDate.day() === 3 || currentDate.day() === 5; // default Mon/Wed/Fri

      // Find existing attendance doc
      const attDoc = data.attendances.find((a) => dayjs(a.lessonDate).isSame(currentDate, 'day'));

      if (matchesSchedule) {
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;
        let excusedCount = 0;

        if (attDoc && attDoc.records) {
          attDoc.records.forEach((r) => {
            if (r.status === 'present') presentCount++;
            if (r.status === 'absent') absentCount++;
            if (r.status === 'late') lateCount++;
            if (r.status === 'excused') excusedCount++;
          });
        }

        lessons.push({
          dateStr: currentDate.format('YYYY-MM-DD'),
          formattedDate: currentDate.format('DD.MM.YYYY'),
          dayOfWeek: weekDayNamesUz[dayOfWeekUpper] || currentDate.format('dd'),
          startTime: attDoc?.lessonStartTime || startTime,
          endTime: attDoc?.lessonEndTime || endTime,
          attendanceDoc: attDoc,
          isMarked: Boolean(attDoc && attDoc.records && attDoc.records.length > 0),
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
        });
      }
    }

    return lessons;
  }, [data, selectedMonth, selectedYear]);

  // Open Yo'qlama Modal
  const handleOpenYoqlama = (lessonItem: (typeof monthLessonsList)[0]) => {
    setActiveLessonDate(lessonItem.dateStr);
    setActiveStartTime(lessonItem.startTime);
    setActiveEndTime(lessonItem.endTime);

    const students = data?.group?.studentIds ?? [];
    const attDoc = lessonItem.attendanceDoc;

    if (attDoc) {
      // Map existing records or add missing students
      const mappedRecords: StudentAttendanceRecord[] = students.map((s) => {
        const existingRec = attDoc.records?.find((r) => String((r.studentId as any)?._id || r.studentId) === s._id);
        return {
          studentId: s._id,
          status: existingRec?.status || 'present',
          note: existingRec?.note || '',
        };
      });
      setRecords(mappedRecords);
    } else {
      // Default all to present
      setRecords(
        students.map((s) => ({
          studentId: s._id,
          status: 'present',
          note: '',
        })),
      );
    }

    setSearchQuery('');
    setModalOpen(true);
  };

  // Status counters
  const counters = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    records.forEach((r) => {
      if (r.status === 'present') present++;
      if (r.status === 'absent') absent++;
      if (r.status === 'late') late++;
      if (r.status === 'excused') excused++;
    });
    return { present, absent, late, excused, total: records.length };
  }, [records]);

  // Bulk Status Setter
  const handleBulkSetStatus = (status: 'present' | 'absent' | 'late' | 'excused') => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  // Change single student status
  const handleSingleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setRecords((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, status } : r)));
  };

  // Change single student note
  const handleNoteChange = (studentId: string, note: string) => {
    setRecords((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, note } : r)));
  };

  // Save Attendance
  const handleSaveAttendance = async () => {
    if (!selectedGroupId || !activeLessonDate) return;
    setSubmitting(true);
    try {
      const payload = {
        groupId: selectedGroupId,
        lessonDate: dayjs(activeLessonDate).toISOString(),
        lessonStartTime: activeStartTime,
        lessonEndTime: activeEndTime,
        records: records.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          note: r.note || '',
        })),
      };

      await apiClient.post('/superadmin/attendance', payload);
      message.success('Yo\'qlama muvaffaqiyatli saqlandi');
      setModalOpen(false);
      await fetchGroupAttendance(selectedGroupId, selectedMonth, selectedYear);
    } catch {
      message.error('Yo\'qlamani saqlashda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Students for Modal Search
  const filteredStudents = useMemo(() => {
    const students = data?.group?.studentIds ?? [];
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) => s.fullName.toLowerCase().includes(q) || (s.phone && s.phone.toLowerCase().includes(q)),
    );
  }, [data, searchQuery]);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Top Controls Card */}
      <Card bodyStyle={{ padding: 20 }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} sm={12} md={8}>
            <Form.Item label={<Typography.Text strong>GURUH</Typography.Text>} style={{ margin: 0 }}>
              <Select
                value={selectedGroupId}
                onChange={setSelectedGroupId}
                options={groups.map((g) => ({ value: g._id, label: g.name }))}
                style={{ width: '100%' }}
                size="large"
                placeholder="Guruhni tanlang"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item label={<Typography.Text strong>OY</Typography.Text>} style={{ margin: 0 }}>
                  <Select value={selectedMonth} onChange={setSelectedMonth} options={monthOptions} style={{ width: '100%' }} size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={<Typography.Text strong>YIL</Typography.Text>} style={{ margin: 0 }}>
                  <Select value={selectedYear} onChange={setSelectedYear} options={yearOptions} style={{ width: '100%' }} size="large" />
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* Group Info Summary */}
      {data?.group && (
        <Card size="small" style={{ background: '#fafafa' }}>
          <Row gutter={16} align="middle">
            <Col>
              <Typography.Text type="secondary">Guruh: </Typography.Text>
              <Typography.Text strong>{data.group.name}</Typography.Text>
            </Col>
            <Col>
              <Typography.Text type="secondary">Kurs: </Typography.Text>
              <Typography.Text strong>{data.group.courseId?.name || '-'}</Typography.Text>
            </Col>
            <Col>
              <Typography.Text type="secondary">O'qituvchi: </Typography.Text>
              <Typography.Text strong>{data.group.teacherId?.fullName || '-'}</Typography.Text>
            </Col>
            <Col>
              <Typography.Text type="secondary">Talabalar: </Typography.Text>
              <Tag color="purple">{data.group.studentIds?.length || 0} ta o'quvchi</Tag>
            </Col>
          </Row>
        </Card>
      )}

      {/* Group Lessons List Table */}
      <Card title={`Darslar ( ${monthLessonsList.length} ta )`}>
        <Table
          rowKey="dateStr"
          dataSource={monthLessonsList}
          loading={loading}
          pagination={false}
          locale={{ emptyText: "Ushbu guruh uchun darslar mavjud emas" }}
          columns={[
            {
              title: '№',
              render: (_: unknown, __: unknown, index: number) => index + 1,
              width: 60,
            },
            {
              title: 'SANA',
              dataIndex: 'formattedDate',
              render: (val: string, record: (typeof monthLessonsList)[0]) => (
                <Space>
                  <CalendarOutlined style={{ color: '#722ed1' }} />
                  <Typography.Text strong>{val}</Typography.Text>
                  <Tag color="blue">{record.dayOfWeek}</Tag>
                </Space>
              ),
            },
            {
              title: 'VAQT',
              render: (_: unknown, record: (typeof monthLessonsList)[0]) => (
                <Typography.Text type="secondary">
                  <ClockCircleOutlined /> {record.startTime} - {record.endTime}
                </Typography.Text>
              ),
            },
            {
              title: 'HOLATI',
              render: (_: unknown, record: (typeof monthLessonsList)[0]) =>
                record.isMarked ? (
                  <Space size="small">
                    <Tag color="green">✔ Bor: {record.presentCount}</Tag>
                    {record.absentCount > 0 && <Tag color="red">✖ Yo'q: {record.absentCount}</Tag>}
                    {record.lateCount > 0 && <Tag color="orange">⏰ {record.lateCount}</Tag>}
                    {record.excusedCount > 0 && <Tag color="blue">📝 {record.excusedCount}</Tag>}
                  </Space>
                ) : (
                  <Tag color="default" style={{ fontStyle: 'italic' }}>Rejalashtirilgan</Tag>
                ),
            },
            {
              title: 'AMAL',
              render: (_: unknown, record: (typeof monthLessonsList)[0]) => (
                <Button
                  type={record.isMarked ? 'default' : 'primary'}
                  size="middle"
                  style={{
                    borderRadius: 20,
                    backgroundColor: record.isMarked ? '#f0f5ff' : '#722ed1',
                    borderColor: record.isMarked ? '#adc6ff' : '#722ed1',
                    color: record.isMarked ? '#2f54eb' : '#fff',
                    fontWeight: 600,
                  }}
                  onClick={() => handleOpenYoqlama(record)}
                >
                  {record.isMarked ? "Yo'qlamani tahrirlash" : "Yo'qlama"}
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {/* Modal Yo'qlama (Mirroring Screenshot 2 Style) */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={850}
        style={{ top: 30 }}
        bodyStyle={{ padding: 24, borderRadius: 16 }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Typography.Title level={4} style={{ margin: 0, color: '#262626' }}>
              <CalendarOutlined style={{ color: '#722ed1', marginRight: 8 }} />
              {dayjs(activeLessonDate).format('DD.MM.YYYY')} ({weekDayNamesUz[dayjs(activeLessonDate).format('dddd').toUpperCase()] || ''}) · {activeStartTime}–{activeEndTime}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              ✔ Yo'qlama: {dayjs(activeLessonDate).format('DD.MM.YYYY')} — {activeStartTime}–{activeEndTime}
            </Typography.Text>
          </div>

          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={submitting}
            onClick={handleSaveAttendance}
            style={{
              backgroundColor: '#597ef7',
              borderColor: '#597ef7',
              borderRadius: 8,
              height: 40,
              paddingInline: 24,
              fontWeight: 600,
            }}
          >
            Saqlash
          </Button>
        </div>

        {/* Barchasini Belgilash (Bulk Actions) + Qidirish */}
        <div
          style={{
            background: '#fafafa',
            border: '1px solid #f0f0f0',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Row gutter={[12, 12]} align="middle" justify="space-between">
            <Col xs={24} md={14}>
              <Space wrap size="small">
                <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                  BARCHASINI BELGILASH:
                </Typography.Text>
                <Button
                  size="small"
                  style={{ borderRadius: 6, borderColor: '#b7eb8f', color: '#389e0d', background: '#f6ffed', fontWeight: 600 }}
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleBulkSetStatus('present')}
                >
                  ✔ Bor
                </Button>
                <Button
                  size="small"
                  style={{ borderRadius: 6, borderColor: '#ffa39e', color: '#cf1322', background: '#fff1f0', fontWeight: 600 }}
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleBulkSetStatus('absent')}
                >
                  ✖ Yo'q
                </Button>
                <Button
                  size="small"
                  style={{ borderRadius: 6, borderColor: '#ffe58f', color: '#d48806', background: '#fffbe6', fontWeight: 600 }}
                  icon={<ClockCircleOutlined />}
                  onClick={() => handleBulkSetStatus('late')}
                >
                  ⏰ Kechikdi
                </Button>
                <Button
                  size="small"
                  style={{ borderRadius: 6, borderColor: '#91d5ff', color: '#0958d9', background: '#e6f7ff', fontWeight: 600 }}
                  icon={<FileTextOutlined />}
                  onClick={() => handleBulkSetStatus('excused')}
                >
                  📝 Sababli
                </Button>
              </Space>
            </Col>

            <Col xs={24} md={10}>
              <Input
                placeholder="Qidirish: Ism yoki telefon..."
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
                style={{ borderRadius: 8 }}
              />
            </Col>
          </Row>
        </div>

        {/* Counter Summary Pills Bar */}
        <div style={{ marginBottom: 16 }}>
          <Space wrap size="middle">
            <Tag color="green" style={{ borderRadius: 12, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
              ✔ Bor: {counters.present}
            </Tag>
            <Tag color="red" style={{ borderRadius: 12, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
              ✖ Yo'q: {counters.absent}
            </Tag>
            <Tag color="warning" style={{ borderRadius: 12, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
              ⏰ Kechikdi: {counters.late}
            </Tag>
            <Tag color="processing" style={{ borderRadius: 12, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
              📝 Sababli: {counters.excused}
            </Tag>
            <Tag color="default" style={{ borderRadius: 12, padding: '4px 12px', fontSize: 13, fontWeight: 600 }}>
              Jami: {counters.total}
            </Tag>
          </Space>
        </div>

        {/* Students List Table */}
        {filteredStudents.length === 0 && records.length === 0 ? (
          <Alert
            type="warning"
            showIcon
            message="Guruhga o'quvchilar biriktirilmagan"
            description={"Yo'qlama oldindan Guruhlar bo'limiga o'tib o'quvchilarni biriktirish kerak."}
            style={{ marginBottom: 16, borderRadius: 8 }}
          />
        ) : (
          <Table
            rowKey="_id"
          dataSource={filteredStudents}
          pagination={false}
          size="middle"
          columns={[
            {
              title: '№',
              render: (_: unknown, __: unknown, idx: number) => idx + 1,
              width: 50,
            },
            {
              title: "O'quvchi",
              render: (_: unknown, student: StudentInfo) => (
                <Space size="middle">
                  <Avatar style={{ backgroundColor: '#722ed1', fontWeight: 600, fontSize: 13 }}>
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
              title: 'Holati',
              width: 260,
              render: (_: unknown, student: StudentInfo) => {
                const rec = records.find((r) => r.studentId === student._id);
                const currentStatus = rec?.status || 'present';

                return (
                  <Space size={6}>
                    {/* Present (Bor) */}
                    <Button
                      shape="circle"
                      size="middle"
                      style={{
                        backgroundColor: currentStatus === 'present' ? '#52c41a' : '#f5f5f5',
                        borderColor: currentStatus === 'present' ? '#52c41a' : '#d9d9d9',
                        color: currentStatus === 'present' ? '#fff' : '#8c8c8c',
                        boxShadow: currentStatus === 'present' ? '0 2px 6px rgba(82, 196, 26, 0.4)' : 'none',
                      }}
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleSingleStatusChange(student._id, 'present')}
                    />

                    {/* Absent (Yo'q) */}
                    <Button
                      shape="circle"
                      size="middle"
                      style={{
                        backgroundColor: currentStatus === 'absent' ? '#ff4d4f' : '#f5f5f5',
                        borderColor: currentStatus === 'absent' ? '#ff4d4f' : '#d9d9d9',
                        color: currentStatus === 'absent' ? '#fff' : '#8c8c8c',
                        boxShadow: currentStatus === 'absent' ? '0 2px 6px rgba(255, 77, 79, 0.4)' : 'none',
                      }}
                      icon={<CloseCircleOutlined />}
                      onClick={() => handleSingleStatusChange(student._id, 'absent')}
                    />

                    {/* Late (Kechikdi) */}
                    <Button
                      shape="circle"
                      size="middle"
                      style={{
                        backgroundColor: currentStatus === 'late' ? '#faad14' : '#f5f5f5',
                        borderColor: currentStatus === 'late' ? '#faad14' : '#d9d9d9',
                        color: currentStatus === 'late' ? '#fff' : '#8c8c8c',
                        boxShadow: currentStatus === 'late' ? '0 2px 6px rgba(250, 173, 20, 0.4)' : 'none',
                      }}
                      icon={<ClockCircleOutlined />}
                      onClick={() => handleSingleStatusChange(student._id, 'late')}
                    />

                    {/* Excused (Sababli) */}
                    <Button
                      shape="circle"
                      size="middle"
                      style={{
                        backgroundColor: currentStatus === 'excused' ? '#1890ff' : '#f5f5f5',
                        borderColor: currentStatus === 'excused' ? '#1890ff' : '#d9d9d9',
                        color: currentStatus === 'excused' ? '#fff' : '#8c8c8c',
                        boxShadow: currentStatus === 'excused' ? '0 2px 6px rgba(24, 144, 255, 0.4)' : 'none',
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
                    style={{ borderRadius: 6 }}
                  />
                );
              },
            },
          ]}
        />
        )}
      </Modal>
    </div>
  );
}
