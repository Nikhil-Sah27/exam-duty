
import { useState } from "react";
import ChangeRequestTable from "./ChangeRequestTable";
import CreateRequestModal from "./CreateRequestModal";

export default function ChangeRequestsPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <ChangeRequestTable onCreateClick={() => setModalOpen(true)} />
      <CreateRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
