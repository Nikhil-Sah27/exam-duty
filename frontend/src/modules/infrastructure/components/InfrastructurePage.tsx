import { useState, FormEvent } from "react";
import { Plus } from "lucide-react";
import { useBuildings, useCreateBuilding } from "../hooks";
import BuildingGrid from "./BuildingGrid";
import { Modal, Input, Button, ErrorAlert } from "@/shared/components";

export default function InfrastructurePage() {
  const { data: buildings, isLoading } = useBuildings();
  const createMutation = useCreateBuilding();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      { name },
      { onSuccess: () => { setName(""); setModalOpen(false); } }
    );
  };

  if (isLoading) return <p className="text-gray-500">Loading buildings...</p>;

  const bldgs = buildings || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rooms & Buildings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage buildings and their rooms.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> New Building
        </button>
      </div>

      <BuildingGrid buildings={bldgs} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Building">
        {createMutation.isError && <ErrorAlert message={createMutation.error.message} />}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Building Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Main Block"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
