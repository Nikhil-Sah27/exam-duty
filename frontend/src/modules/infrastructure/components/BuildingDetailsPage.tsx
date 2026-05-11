import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useBuildings, useDeleteBuilding } from "../hooks";
import BuildingHeader from "./BuildingHeader";
import RoomList from "./RoomList";

export default function BuildingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: buildings, isLoading } = useBuildings();
  const deleteMutation = useDeleteBuilding();

  const building = (buildings || []).find((b) => b._id === id);

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!building) return <p className="text-red-600">Building not found.</p>;

  const handleDelete = () => {
    if (!confirm(`Delete building "${building.name}"?`)) return;
    deleteMutation.mutate(building._id, {
      onSuccess: () => navigate("/infrastructure"),
    });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-400">
        <Link to="/infrastructure" className="transition-colors hover:text-gray-700">
          Rooms & Buildings
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-gray-700">{building.name}</span>
      </nav>

      <BuildingHeader building={building} onDelete={handleDelete} />

      <RoomList buildingId={id!} />
    </div>
  );
}
