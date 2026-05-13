import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedLayout from "@/shared/components/ProtectedLayout";
import LoginForm from "@/modules/auth/components/LoginForm";
import DashboardPage from "@/modules/dashboard/components/DashboardPage";
import CreateExamsPage from "@/modules/create-exams/components/CreateExamsPage";
import ExamsPage from "@/modules/exams/components/ExamsPage";
import ExamDetails from "@/modules/exams/components/ExamDetails";
import DutiesPage from "@/modules/duties/components/DutiesPage";
import UsersPage from "@/modules/users/components/UsersPage";
import ChangeRequestsPage from "@/modules/change-requests/components/ChangeRequestsPage";
import DepartmentsPage from "@/modules/departments/components/DepartmentsPage";
import DepartmentDetailsPage from "@/modules/departments/components/DepartmentDetailsPage";
import InfrastructurePage from "@/modules/infrastructure/components/InfrastructurePage";
import BuildingDetailsPage from "@/modules/infrastructure/components/BuildingDetailsPage";
import ReportsPage from "@/modules/reports/components/ReportsPage";
import AuditPage from "@/modules/audit/components/AuditPage";
import ManageDutiesPage from "@/modules/manage-duties/components/ManageDutiesPage";
import TeacherDetailsPage from "@/modules/manage-duties/components/TeacherDetailsPage";
import { invigilatorRoutes } from "@/modules/invigilator/routes/invigilatorRoutes";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/create-exams" element={<CreateExamsPage />} />
        <Route path="/exams" element={<ExamsPage />} />
        <Route path="/exams/:id" element={<ExamDetails />} />
        <Route path="/duties" element={<DutiesPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/requests" element={<ChangeRequestsPage />} />
        <Route path="/manage-duties" element={<ManageDutiesPage />} />
        <Route path="/manage-duties/:id" element={<TeacherDetailsPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/departments/:id" element={<DepartmentDetailsPage />} />
        <Route path="/infrastructure" element={<InfrastructurePage />} />
        <Route path="/infrastructure/:id" element={<BuildingDetailsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/audit" element={<AuditPage />} />
      </Route>
      {invigilatorRoutes}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
