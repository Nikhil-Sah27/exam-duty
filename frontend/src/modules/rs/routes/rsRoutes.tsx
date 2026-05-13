import { Navigate, Route } from "react-router-dom";
import RSLayout from "../components/RSLayout";
import Dashboard from "../pages/Dashboard";
import InvigilatorExamsPage from "@/modules/invigilator/exams/pages/InvigilatorExamsPage";
import InvigilatorExamDetailsPage from "@/modules/invigilator/exams/pages/InvigilatorExamDetailsPage";
import SelectDutyPage from "@/modules/invigilator/select-duty/pages/SelectDutyPage";
import UpcomingDutiesPage from "@/modules/invigilator/upcoming-duties/pages/UpcomingDutiesPage";
import InvigilatorChangeRequestsPage from "@/modules/invigilator/change-requests/pages/InvigilatorChangeRequestsPage";

/**
 * The RS dashboard mounts the SAME page components used by the Invigilator
 * dashboard. Role-awareness lives one level down — components read
 * `user.role` via the shared role config and adapt slot occupancy + modal
 * interactivity automatically (RS users own the rsAssigned slot; the modal's
 * RS row becomes the interactive one with the [Select Duty] button).
 */
export const rsRoutes = (
  <Route path="/rs" element={<RSLayout />}>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="exams" element={<InvigilatorExamsPage />} />
    <Route path="exams/:id" element={<InvigilatorExamDetailsPage />} />
    <Route path="select-duty" element={<SelectDutyPage />} />
    <Route path="upcoming-duties" element={<UpcomingDutiesPage />} />
    <Route path="change-requests" element={<InvigilatorChangeRequestsPage />} />
  </Route>
);
