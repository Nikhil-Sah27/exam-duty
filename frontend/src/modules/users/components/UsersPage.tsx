import { useState } from "react";
import TeacherTable from "./TeacherTable";
import CreateUserModal from "./CreateUserModal";

export default function UsersPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <TeacherTable onCreateClick={() => setModalOpen(true)} />
      <CreateUserModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
