import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { App as AntdApp, ConfigProvider } from 'antd';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { antdTheme } from './theme/brand';
import { UsersPage } from './pages/UsersPage';
import { BranchesPage } from './pages/BranchesPage';
import { CoursesPage } from './pages/CoursesPage';
import { GroupsPage } from './pages/GroupsPage';
import { SchedulesPage } from './pages/SchedulesPage';
import { AttendancePage } from './pages/AttendancePage';
import { PaymentsPage } from './pages/PaymentsPage';
import { FinancePage } from './pages/FinancePage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ParentRelationsPage } from './pages/ParentRelationsPage';
import { GroupsPage as TeacherGroupsPage } from './pages/teacher/GroupsPage';
import { SchedulesPage as TeacherSchedulesPage } from './pages/teacher/SchedulesPage';
import { AttendancePage as TeacherAttendancePage } from './pages/teacher/AttendancePage';
import { PayrollPage as TeacherPayrollPage } from './pages/teacher/PayrollPage';
import { SchedulesPage as StudentSchedulesPage } from './pages/student/SchedulesPage';
import { AttendancePage as StudentAttendancePage } from './pages/student/AttendancePage';
import { PaymentsPage as StudentPaymentsPage } from './pages/student/PaymentsPage';
import { NotificationsPage as StudentNotificationsPage } from './pages/student/NotificationsPage';
import { ChildrenPage as ParentChildrenPage } from './pages/parent/ChildrenPage';
import { PaymentsPage as ParentPaymentsPage } from './pages/parent/PaymentsPage';
import { NotificationsPage as ParentNotificationsPage } from './pages/parent/NotificationsPage';

export function App() {
  return (
    <ConfigProvider theme={antdTheme}>
      <AntdApp>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                  {/* Shared Admin Routes (SUPER_ADMIN and ADMIN) */}
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="users" element={<UsersPage />} />
                  <Route path="courses" element={<CoursesPage />} />
                  <Route path="groups" element={<GroupsPage />} />
                  <Route path="schedules" element={<SchedulesPage />} />
                  <Route path="attendance" element={<AttendancePage />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="finance" element={<FinancePage />} />
                  <Route path="finance/payroll" element={<Navigate to="/finance" replace />} />
                  <Route path="parent-relations" element={<ParentRelationsPage />} />

                  {/* SuperAdmin Only Routes */}
                  <Route element={<ProtectedRoute roles={['SUPER_ADMIN']} />}>
                    <Route path="branches" element={<BranchesPage />} />
                    <Route path="audit-logs" element={<AuditLogsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>

                  {/* Teacher Routes */}
                  <Route element={<ProtectedRoute roles={['TEACHER']} />}>
                    <Route path="teacher/groups" element={<TeacherGroupsPage />} />
                    <Route path="teacher/schedules" element={<TeacherSchedulesPage />} />
                    <Route path="teacher/attendance" element={<TeacherAttendancePage />} />
                    <Route path="teacher/payroll" element={<TeacherPayrollPage />} />
                  </Route>

                  {/* Student Routes */}
                  <Route element={<ProtectedRoute roles={['STUDENT']} />}>
                    <Route path="student/schedules" element={<StudentSchedulesPage />} />
                    <Route path="student/attendance" element={<StudentAttendancePage />} />
                    <Route path="student/payments" element={<StudentPaymentsPage />} />
                    <Route path="student/notifications" element={<StudentNotificationsPage />} />
                  </Route>

                  {/* Parent Routes */}
                  <Route element={<ProtectedRoute roles={['PARENT']} />}>
                    <Route path="parent/children" element={<ParentChildrenPage />} />
                    <Route path="parent/payments" element={<ParentPaymentsPage />} />
                    <Route path="parent/notifications" element={<ParentNotificationsPage />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}
