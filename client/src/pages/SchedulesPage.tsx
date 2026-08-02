import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Input, Row, Space, Typography } from 'antd';
import { LeftOutlined, RightOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
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

function getMonthCells(year: number, month: number) {
  const start = dayjs(new Date(year, month, 1));
  const totalDays = start.daysInMonth();
  const startIndex = (start.day() + 6) % 7;
  return Array.from({ length: 42 }, (_, idx) => {
    const day = idx - startIndex + 1;
    return day >= 1 && day <= totalDays ? start.date(day) : null;
  });
}

function getWeekStart(date: dayjs.Dayjs) {
  const weekday = date.day();
  return weekday === 0 ? date.subtract(6, 'day') : date.subtract(weekday - 1, 'day');
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
  const [year, setYear] = useState(dayjs().year());
  const [groupQuery, setGroupQuery] = useState('');
  const [teacherQuery, setTeacherQuery] = useState('');
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'month' | 'year' | 'list'>('year');

  useEffect(() => {
    void apiClient.get<{ success: true; data: ReferenceData }>('/superadmin/references').then(({ data }) => {
      setReferences({ groups: data.data.groups ?? [], teachers: data.data.teachers ?? [] });
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data } = await apiClient.get<{ success: true; data: ScheduleRecord[] }>('/superadmin/schedules');
      setSchedules(data.data);
    };
    void load();
  }, []);

  const filteredSchedules = useMemo(() => {
    const hasReferenceData = references.groups.length > 0 || references.teachers.length > 0;

    return schedules.filter((schedule) => {
      const groupMatches = groupQuery
        ? schedule.groupId?.name?.toLowerCase().includes(groupQuery.toLowerCase())
        : true;
      const teacherMatches = teacherQuery
        ? schedule.teacherId?.fullName?.toLowerCase().includes(teacherQuery.toLowerCase())
        : true;
      const referenceMatches = hasReferenceData
        ? Boolean(references.groups.some((group) => group._id === schedule.groupId?._id) || references.teachers.some((teacher) => teacher._id === schedule.teacherId?._id))
        : true;
      return Boolean(groupMatches && teacherMatches && referenceMatches);
    });
  }, [schedules, groupQuery, teacherQuery, references]);

  const [selectedDate, setSelectedDate] = useState(dayjs());

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
  const weekStart = getWeekStart(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, idx) => weekStart.add(idx, 'day'));
  const monthDates = getMonthCells(year, selectedDate.month());
  const yearMonths = Array.from({ length: 12 }, (_, idx) => idx);

  return (
    <div style={{ paddingBottom: 24 }}>
      <Card style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 24 }} bodyStyle={{ padding: 24 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Typography.Title level={3} style={{ margin: 0 }}>
              Dars jadvali
            </Typography.Title>
          </Col>
          <Col>
            <Space wrap>
              {['week', 'day', 'month', 'year', 'list'].map((mode) => (
                <Button
                  key={mode}
                  type={viewMode === mode ? 'primary' : 'default'}
                  onClick={() => setViewMode(mode as typeof viewMode)}
                >
                  {mode === 'week'
                    ? 'Hafta'
                    : mode === 'day'
                    ? 'Kun'
                    : mode === 'month'
                    ? 'Oy'
                    : mode === 'year'
                    ? 'Yil'
                    : "Ro'yxat"}
                </Button>
              ))}
              <Button icon={<ReloadOutlined />} onClick={() => setYear(dayjs().year())}>
                Yangilash
              </Button>
              <Button type="primary" icon={<PlusOutlined />}>
                Jadval qo‘shish
              </Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 20 }}>
          <Col xs={24} md={8}>
            <Input.Search placeholder="Guruh" allowClear value={groupQuery} onChange={(event) => setGroupQuery(event.target.value)} />
          </Col>
          <Col xs={24} md={8}>
            <Input.Search placeholder="O‘qituvchi" allowClear value={teacherQuery} onChange={(event) => setTeacherQuery(event.target.value)} />
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<LeftOutlined />} onClick={() => setYear((y) => y - 1)} />
              <Button type="default">{year}</Button>
              <Button icon={<RightOutlined />} onClick={() => setYear((y) => y + 1)} />
              <Button type="default" onClick={() => setYear(dayjs().year())}>
                Bugun
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {viewMode === 'week' && (
        <Card style={{ borderRadius: 24, marginBottom: 24, background: '#f7f8ff' }} bodyStyle={{ padding: 24 }}>
          <Typography.Title level={4}>Haftalik ko‘rinish</Typography.Title>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={12}>
              <Space>
                <Button onClick={() => setSelectedDate((date) => date.subtract(7, 'day'))}>◀ Oldingi hafta</Button>
                <Button onClick={() => setSelectedDate(dayjs())}>Bugun</Button>
                <Button onClick={() => setSelectedDate((date) => date.add(7, 'day'))}>Keyingi hafta ▶</Button>
              </Space>
            </Col>
            <Col xs={24} md={12} style={{ textAlign: 'right' }}>
              <Typography.Text strong>{weekStart.format('DD.MM.YYYY')} — {weekStart.add(6, 'day').format('DD.MM.YYYY')}</Typography.Text>
            </Col>
          </Row>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
            {weekDays.map((date) => {
              const key = date.format('YYYY-MM-DD');
              const daySchedules = scheduleMap.get(key) ?? [];

              return (
                <Card key={key} bodyStyle={{ padding: 16, minHeight: 180, borderRadius: 18 }}>
                  <Typography.Text strong>{DAY_LABELS[date.day()]}, {date.format('DD')}</Typography.Text>
                  <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                    {MONTH_LABELS[date.month()]}
                  </Typography.Text>

                  {daySchedules.length === 0 ? (
                    <Typography.Text type="secondary">Dars yo‘q</Typography.Text>
                  ) : (
                    daySchedules.map((schedule) => (
                      <div key={schedule._id} style={{ marginBottom: 10, padding: 10, borderRadius: 14, background: '#fff', boxShadow: '0 6px 12px rgba(15, 23, 42, 0.05)' }}>
                        <Typography.Text strong>{schedule.groupId?.name ?? 'Guruh'}</Typography.Text>
                        <div style={{ marginTop: 4 }}>
                          <Typography.Text type="secondary">{schedule.startTime} — {schedule.endTime}</Typography.Text>
                        </div>
                      </div>
                    ))
                  )}
                </Card>
              );
            })}
          </div>
        </Card>
      )}

      {viewMode === 'day' && (
        <Card style={{ borderRadius: 24, marginBottom: 24, background: '#f3f7ff' }} bodyStyle={{ padding: 24 }}>
          <Typography.Title level={4}>Kunlik ko‘rinish</Typography.Title>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={12}>
              <Space>
                <Button onClick={() => setSelectedDate((date) => date.subtract(1, 'day'))}>◀</Button>
                <Button onClick={() => setSelectedDate(dayjs())}>Bugun</Button>
                <Button onClick={() => setSelectedDate((date) => date.add(1, 'day'))}>▶</Button>
              </Space>
            </Col>
            <Col xs={24} md={12} style={{ textAlign: 'right' }}>
              <Typography.Text strong>{selectedDate.format('DD.MM.YYYY')}</Typography.Text>
            </Col>
          </Row>
          <Card style={{ borderRadius: 18, padding: 20 }}>
            <Typography.Title level={5}>{DAY_LABELS[selectedDate.day()]}, {selectedDate.format('DD MMMM YYYY')}</Typography.Title>
            {scheduleMap.get(selectedDate.format('YYYY-MM-DD'))?.length ? (
              scheduleMap.get(selectedDate.format('YYYY-MM-DD'))?.map((schedule) => (
                <Card key={schedule._id} style={{ marginBottom: 16, borderRadius: 16 }}>
                  <Typography.Text strong>{schedule.groupId?.name ?? 'Guruh'}</Typography.Text>
                  <div>{schedule.startTime} — {schedule.endTime}</div>
                  <Typography.Text type="secondary">{schedule.teacherId?.fullName ?? 'O‘qituvchi'}</Typography.Text>
                </Card>
              ))
            ) : (
              <Typography.Text type="secondary">Bugun jadvalda dars yo‘q</Typography.Text>
            )}
          </Card>
        </Card>
      )}

      {viewMode === 'month' && (
        <Card style={{ borderRadius: 24, marginBottom: 24, background: '#f0f5ff' }} bodyStyle={{ padding: 24 }}>
          <Typography.Title level={4}>Oylik ko‘rinish</Typography.Title>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={12}>
              <Space>
                <Button onClick={() => setSelectedDate((date) => date.subtract(1, 'month'))}>◀</Button>
                <Button onClick={() => setSelectedDate(dayjs())}>Bugun</Button>
                <Button onClick={() => setSelectedDate((date) => date.add(1, 'month'))}>▶</Button>
              </Space>
            </Col>
            <Col xs={24} md={12} style={{ textAlign: 'right' }}>
              <Typography.Text strong>{MONTH_LABELS[selectedDate.month()]} {selectedDate.year()}</Typography.Text>
            </Col>
          </Row>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginBottom: 12, textAlign: 'center' }}>
            {DAY_LABELS.map((label) => (
              <Typography.Text key={label} type="secondary" style={{ fontSize: 12, fontWeight: 700 }}>
                {label}
              </Typography.Text>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
            {monthDates.map((date, idx) => {
              if (!date) {
                return <div key={idx} style={{ minHeight: 72, background: '#fff', borderRadius: 16 }} />;
              }

              const dateKey = date.format('YYYY-MM-DD');
              const daySchedules = scheduleMap.get(dateKey) ?? [];
              const isCurrentMonth = date.month() === selectedDate.month();

              return (
                <div
                  key={idx}
                  style={{
                    minHeight: 72,
                    padding: 12,
                    borderRadius: 16,
                    background: isCurrentMonth ? '#fff' : '#f7f8ff',
                    border: dateKey === todayKey ? '1px solid #1d39c4' : '1px solid transparent',
                  }}
                >
                  <Typography.Text strong>{date.date()}</Typography.Text>
                  <div style={{ marginTop: 8 }}>
                    {daySchedules.slice(0, 2).map((schedule) => (
                      <div key={schedule._id} style={{ marginBottom: 6, padding: 6, borderRadius: 12, background: '#f4f6ff' }}>
                        <Typography.Text strong style={{ fontSize: 12 }}>{schedule.groupId?.name}</Typography.Text>
                        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.65)' }}>{schedule.startTime}</div>
                      </div>
                    ))}
                    {daySchedules.length > 2 && (
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        +{daySchedules.length - 2} boshqalar
                      </Typography.Text>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {viewMode === 'year' && (
        <Card style={{ borderRadius: 24, marginBottom: 24, background: '#fef7ff' }} bodyStyle={{ padding: 24 }}>
          <Typography.Title level={4}>Yillik ko‘rinish</Typography.Title>
          <Row gutter={[16, 16]}>
            {yearMonths.map((monthIndex) => {
              const cells = getMonthCells(year, monthIndex);

              return (
                <Col key={monthIndex} xs={24} sm={12} lg={8} xl={6}>
                  <Card style={{ borderRadius: 24, minHeight: 320, background: '#fff' }} bodyStyle={{ padding: 16 }}>
                    <Typography.Title level={5} style={{ textAlign: 'center', marginBottom: 16 }}>
                      {MONTH_LABELS[monthIndex]}
                    </Typography.Title>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 10, textAlign: 'center' }}>
                      {DAY_LABELS.map((label) => (
                        <Typography.Text key={label} type="secondary" style={{ fontSize: 12, fontWeight: 700 }}>
                          {label}
                        </Typography.Text>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                      {cells.map((date, idx) => {
                        if (!date) {
                          return <div key={idx} style={{ minHeight: 48 }} />;
                        }

                        const dateKey = date.format('YYYY-MM-DD');
                        const daySchedules = scheduleMap.get(dateKey) ?? [];
                        const isToday = dateKey === todayKey;

                        return (
                          <div
                            key={idx}
                            style={{
                              minHeight: 48,
                              borderRadius: 12,
                              padding: '6px 8px',
                              background: isToday ? '#e6f7ff' : '#fff',
                              border: daySchedules.length ? '1px solid rgba(89, 80, 255, 0.18)' : '1px solid transparent',
                            }}
                          >
                            <Typography.Text style={{ fontSize: 12 }}>{date.date()}</Typography.Text>
                            {daySchedules.length > 0 && (
                              <div style={{ marginTop: 4 }}>
                                <Badge count={daySchedules.length} style={{ backgroundColor: '#2f54eb' }} />
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
        </Card>
      )}

      {viewMode === 'list' && (
        <Card style={{ marginTop: 24, borderRadius: 24 }}>
          <Typography.Title level={5}>Ro'yxat</Typography.Title>
          {filteredSchedules.length === 0 ? (
            <Typography.Text>Hech qanday dars topilmadi</Typography.Text>
          ) : (
            filteredSchedules.map((schedule) => (
              <Card key={schedule._id} style={{ marginBottom: 16, borderRadius: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Typography.Text strong>{schedule.groupId?.name ?? '—'}</Typography.Text>
                  <Typography.Text>{schedule.teacherId?.fullName ?? '—'}</Typography.Text>
                  <Typography.Text type="secondary">
                    {Array.isArray(schedule.weekDays) ? schedule.weekDays.join(', ') : '-'} • {schedule.startTime || '-'} – {schedule.endTime || '-'}
                  </Typography.Text>
                </Space>
              </Card>
            ))
          )}
        </Card>
      )}
    </div>
  );
}
