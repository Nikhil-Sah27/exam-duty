import { Navigate, Route } from "react-router-dom";
import DCSLayout from "../components/DCSLayout";
import Dashboard from "../pages/Dashboard";
import InvigilatorExamsPage from "@/modules/invigilator/exams/pages/InvigilatorExamsPage";
import InvigilatorExamDetailsPage from "@/modules/invigilator/exams/pages/InvigilatorExamDetailsPage";
import DCSSelectDutyPage from "../select-duty/pages/SelectDutyPage";
import DcsUpcomingDutiesPage from "../upcoming-duties/pages/DcsUpcomingDutiesPage";
import DcsChangeRequestsPage from "../change-requests/pages/DcsChangeRequestsPage";

/**
 * DCS reuses the Invigilator pages for Exams, gets its own Select Duty
 * (group-based, sized by student count), its own Upcoming Duties view
 * (per-room invigilator contacts), and its own Change Requests page that
 * operates on whole DCS duty groups instead of per-room duties.
 */
export const dcsRoutes = (
  <Route path="/dcs" element={<DCSLayout />}>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="exams" element={<InvigilatorExamsPage />} />
    <Route path="exams/:id" element={<InvigilatorExamDetailsPage />} />
    <Route path="select-duty" element={<DCSSelectDutyPage />} />
    <Route path="upcoming-duties" element={<DcsUpcomingDutiesPage />} />
    <Route path="change-requests" element={<DcsChangeRequestsPage />} />
  </Route>
);
