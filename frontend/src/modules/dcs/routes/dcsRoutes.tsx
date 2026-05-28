import { Navigate, Route } from "react-router-dom";
import DCSLayout from "../components/DCSLayout";
import Dashboard from "../pages/Dashboard";
import InvigilatorExamsPage from "@/modules/invigilator/exams/pages/InvigilatorExamsPage";
import InvigilatorExamDetailsPage from "@/modules/invigilator/exams/pages/InvigilatorExamDetailsPage";
import DCSSelectDutyPage from "../select-duty/pages/SelectDutyPage";
import DcsUpcomingDutiesPage from "../upcoming-duties/pages/DcsUpcomingDutiesPage";
import InvigilatorChangeRequestsPage from "@/modules/invigilator/change-requests/pages/InvigilatorChangeRequestsPage";

/**
 * DCS reuses the Invigilator pages for Exams and Change Requests, gets its
 * own Select Duty (group-based, sized by student count) and its own Upcoming
 * Duties view (per-room invigilator contacts).
 */
export const dcsRoutes = (
  <Route path="/dcs" element={<DCSLayout />}>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="exams" element={<InvigilatorExamsPage />} />
    <Route path="exams/:id" element={<InvigilatorExamDetailsPage />} />
    <Route path="select-duty" element={<DCSSelectDutyPage />} />
    <Route path="upcoming-duties" element={<DcsUpcomingDutiesPage />} />
    <Route path="change-requests" element={<InvigilatorChangeRequestsPage />} />
  </Route>
);
