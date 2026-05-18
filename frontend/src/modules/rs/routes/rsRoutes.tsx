import { Navigate, Route } from "react-router-dom";
import RSLayout from "../components/RSLayout";
import Dashboard from "../pages/Dashboard";
import InvigilatorExamsPage from "@/modules/invigilator/exams/pages/InvigilatorExamsPage";
import InvigilatorExamDetailsPage from "@/modules/invigilator/exams/pages/InvigilatorExamDetailsPage";
import RSSelectDutyPage from "@/modules/rs/select-duty/pages/SelectDutyPage";
import UpcomingDutiesPage from "@/modules/invigilator/upcoming-duties/pages/UpcomingDutiesPage";
import InvigilatorChangeRequestsPage from "@/modules/invigilator/change-requests/pages/InvigilatorChangeRequestsPage";

/**
 * RS reuses the Invigilator pages for everything *except* select-duty —
 * RS selects **groups of rooms** (5 per chunk, per block/exam/time), so it
 * mounts its own SelectDutyPage built on /modules/rs/select-duty. The rest
 * of the dashboard (exams, upcoming-duties, change-requests) still relies
 * on role-aware shared components.
 */
export const rsRoutes = (
  <Route path="/rs" element={<RSLayout />}>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="exams" element={<InvigilatorExamsPage />} />
    <Route path="exams/:id" element={<InvigilatorExamDetailsPage />} />
    <Route path="select-duty" element={<RSSelectDutyPage />} />
    <Route path="upcoming-duties" element={<UpcomingDutiesPage />} />
    <Route path="change-requests" element={<InvigilatorChangeRequestsPage />} />
  </Route>
);
