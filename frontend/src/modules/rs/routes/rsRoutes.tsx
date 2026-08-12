import { Navigate, Route } from "react-router-dom";
import RSLayout from "../components/RSLayout";
import Dashboard from "../pages/Dashboard";
import InvigilatorExamsPage from "@/modules/invigilator/exams/pages/InvigilatorExamsPage";
import InvigilatorExamDetailsPage from "@/modules/invigilator/exams/pages/InvigilatorExamDetailsPage";
import RSSelectDutyPage from "@/modules/rs/select-duty/pages/SelectDutyPage";
import RSUpcomingDutiesPage from "@/modules/rs/upcoming-duties/pages/RSUpcomingDutiesPage";
import RsChangeRequestsPage from "@/modules/rs/change-requests/pages/RsChangeRequestsPage";

/**
 * RS reuses the Invigilator pages for exams + change-requests, but has its
 * own select-duty and upcoming-duties surfaces because RS is group-oriented
 * (5 rooms per chunk, per block/exam/time). Select Duty picks a group;
 * Upcoming Duties displays those selections as one group card, not one card
 * per individual room.
 */
export const rsRoutes = (
  <Route path="/rs" element={<RSLayout />}>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="exams" element={<InvigilatorExamsPage />} />
    <Route path="exams/:id" element={<InvigilatorExamDetailsPage />} />
    <Route path="select-duty" element={<RSSelectDutyPage />} />
    <Route path="upcoming-duties" element={<RSUpcomingDutiesPage />} />
    <Route path="change-requests" element={<RsChangeRequestsPage />} />
  </Route>
);
