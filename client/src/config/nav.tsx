import {
  AuditOutlined,
  BankOutlined,
  BookOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  DashboardOutlined,
  DollarOutlined,
  FileTextOutlined,
  SettingOutlined,
  SolutionOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { Role } from '../types';

export interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  { key: '/', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: '/users', label: 'Foydalanuvchilar', icon: <UserOutlined /> },
  { key: '/branches', label: 'Filiallar', icon: <BankOutlined /> },
  { key: '/courses', label: 'Kurslar', icon: <BookOutlined /> },
  { key: '/groups', label: 'Guruhlar', icon: <TeamOutlined /> },
  { key: '/schedules', label: 'Dars jadvali', icon: <CalendarOutlined /> },
  { key: '/attendance', label: "Davomat", icon: <CheckSquareOutlined /> },
  { key: '/payments', label: "To'lovlar", icon: <DollarOutlined /> },
  { key: '/finance', label: 'Moliya', icon: <SolutionOutlined /> },
  { key: '/audit-logs', label: 'Audit log', icon: <AuditOutlined /> },
  { key: '/settings', label: 'Sozlamalar', icon: <SettingOutlined /> },
  { key: '/parent-relations', label: 'Ota-ona bog‘lanishi', icon: <TeamOutlined /> },
];

const teacherNav: NavItem[] = [
  { key: '/', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: '/teacher/homeworks', label: 'Uy vazifalari', icon: <FileTextOutlined /> },
  { key: '/teacher/quizzes', label: 'Testlar', icon: <SolutionOutlined /> },
];

const studentNav: NavItem[] = [
  { key: '/', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: '/student/schedules', label: 'Dars jadvali', icon: <CalendarOutlined /> },
  { key: '/student/attendance', label: 'Davomatim', icon: <CheckSquareOutlined /> },
  { key: '/student/homeworks', label: 'Uy vazifalari', icon: <FileTextOutlined /> },
  { key: '/student/quizzes', label: 'Testlar', icon: <SolutionOutlined /> },
  { key: '/student/grades', label: 'Baholarim', icon: <AuditOutlined /> },
  { key: '/student/payments', label: "To'lovlarim", icon: <DollarOutlined /> },
  { key: '/student/notifications', label: 'Bildirishnomalar', icon: <AuditOutlined /> },
];

const parentNav: NavItem[] = [
  { key: '/', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: '/parent/children', label: 'Farzandlar', icon: <TeamOutlined /> },
  { key: '/parent/homeworks', label: 'Uy vazifalar', icon: <FileTextOutlined /> },
  { key: '/parent/grades', label: 'Baholar', icon: <AuditOutlined /> },
  { key: '/parent/payments', label: "To'lovlar", icon: <DollarOutlined /> },
  { key: '/parent/notifications', label: 'Bildirishnomalar', icon: <AuditOutlined /> },
];

export function getNavForRole(role: Role): NavItem[] {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return adminNav;
    case 'TEACHER':
      return teacherNav;
    case 'STUDENT':
      return studentNav;
    case 'PARENT':
      return parentNav;
    default:
      return [];
  }
}
