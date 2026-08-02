import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConfigProvider } from 'antd';
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
import { HomeworksPage as AdminHomeworksPage } from './pages/HomeworksPage';
import { QuizzesPage as AdminQuizzesPage } from './pages/QuizzesPage';
import { GradesPage as AdminGradesPage } from './pages/GradesPage';
import { ParentRelationsPage } from './pages/ParentRelationsPage';
import { HomeworksPage as TeacherHomeworksPage } from './pages/teacher/HomeworksPage';
import { QuizzesPage as TeacherQuizzesPage } from './pages/teacher/QuizzesPage';
import { SchedulesPage as StudentSchedulesPage } from './pages/student/SchedulesPage';
import { AttendancePage as StudentAttendancePage } from './pages/student/AttendancePage';
import { HomeworksPage as StudentHomeworksPage } from './pages/student/HomeworksPage';
import { QuizzesPage as StudentQuizzesPage } from './pages/student/QuizzesPage';
import { GradesPage as StudentGradesPage } from './pages/student/GradesPage';
import { PaymentsPage as StudentPaymentsPage } from './pages/student/PaymentsPage';
import { NotificationsPage as StudentNotificationsPage } from './pages/student/NotificationsPage';
import { ChildrenPage as ParentChildrenPage } from './pages/parent/ChildrenPage';
import { HomeworksPage as ParentHomeworksPage } from './pages/parent/HomeworksPage';
import { GradesPage as ParentGradesPage } from './pages/parent/GradesPage';
import { PaymentsPage as ParentPaymentsPage } from './pages/parent/PaymentsPage';
import { NotificationsPage as ParentNotificationsPage } from './pages/parent/NotificationsPage';

export function App() {
  return (
    <ConfigProvider theme={antdTheme}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="branches" element={<BranchesPage />} />
                <Route path="courses" element={<CoursesPage />} />
                <Route path="groups" element={<GroupsPage />} />
                <Route path="schedules" element={<SchedulesPage />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="finance" element={<FinancePage />} />
                <Route path="finance/payroll" element={<Navigate to="/finance" replace />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="parent-relations" element={<ParentRelationsPage />} />
                <Route path="homeworks" element={<AdminHomeworksPage />} />
                <Route path="quizzes" element={<AdminQuizzesPage />} />
                <Route path="grades" element={<AdminGradesPage />} />

                <Route element={<ProtectedRoute roles={['TEACHER']} />}>
                  <Route path="teacher/homeworks" element={<TeacherHomeworksPage />} />
                  <Route path="teacher/quizzes" element={<TeacherQuizzesPage />} />
                </Route>
                <Route element={<ProtectedRoute roles={['STUDENT']} />}>
                  <Route path="student/schedules" element={<StudentSchedulesPage />} />
                  <Route path="student/attendance" element={<StudentAttendancePage />} />
                  <Route path="student/homeworks" element={<StudentHomeworksPage />} />
                  <Route path="student/quizzes" element={<StudentQuizzesPage />} />
                  <Route path="student/grades" element={<StudentGradesPage />} />
                  <Route path="student/payments" element={<StudentPaymentsPage />} />
                  <Route path="student/notifications" element={<StudentNotificationsPage />} />
                </Route>
                <Route element={<ProtectedRoute roles={['PARENT']} />}>
                  <Route path="parent/children" element={<ParentChildrenPage />} />
                  <Route path="parent/homeworks" element={<ParentHomeworksPage />} />
                  <Route path="parent/grades" element={<ParentGradesPage />} />
                  <Route path="parent/payments" element={<ParentPaymentsPage />} />
                  <Route path="parent/notifications" element={<ParentNotificationsPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}
