import { Navigate, Route } from "react-router-dom";
import InvigilatorLayout from "../components/InvigilatorLayout";
import Dashboard from "../pages/Dashboard";
import InvigilatorExamsPage from "../exams/pages/InvigilatorExamsPage";
import InvigilatorExamDetailsPage from "../exams/pages/InvigilatorExamDetailsPage";
import SelectDutyPage from "../select-duty/pages/SelectDutyPage";
import InvigilatorChangeRequestsPage from "../change-requests/pages/InvigilatorChangeRequestsPage";
import UpcomingDutiesPage from "../upcoming-duties/pages/UpcomingDutiesPage";

export const invigilatorRoutes = (
  <Route path="/invigilator" element={<InvigilatorLayout />}>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="exams" element={<InvigilatorExamsPage />} />
    <Route path="exams/:id" element={<InvigilatorExamDetailsPage />} />
    <Route path="select-duty" element={<SelectDutyPage />} />
    <Route path="upcoming-duties" element={<UpcomingDutiesPage />} />
    <Route path="change-requests" element={<InvigilatorChangeRequestsPage />} />
  </Route>
);
