
import { useState } from "react";
import DutyTable from "./DutyTable";
import AssignDutyModal from "./AssignDutyModal";

export default function DutiesPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <DutyTable onAssignClick={() => setModalOpen(true)} />
      <AssignDutyModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
