import { useState, useEffect, FormEvent } from "react";
import { Plus, Trash2, Pencil, Inbox } from "lucide-react";
import { useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse } from "../hooks";
import { Course, CourseExams } from "../types";
import { Modal, Input, Button, ErrorAlert, ConfirmDeleteModal } from "@/shared/components";

interface CourseListProps {
  semesterId: string;
  deptId: string;
}

const EXAM_LABELS: { key: keyof CourseExams; label: string }[] = [
  { key: "ia1", label: "IA1" },
  { key: "ia2", label: "IA2" },
  { key: "ia3", label: "IA3" },
  { key: "see", label: "SEE" },
];

export default function CourseList({ semesterId, deptId }: CourseListProps) {
  const { data: courses, isLoading } = useCourses(semesterId);
  const createMutation = useCreateCourse(semesterId, deptId);
  const updateMutation = useUpdateCourse(semesterId, deptId);
  const deleteMutation = useDeleteCourse(semesterId, deptId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [credits, setCredits] = useState("3");
  const [exams, setExams] = useState<CourseExams>({ ia1: false, ia2: false, ia3: false, see: false });

  const deleteCourse = courses?.find((c) => c._id === deleteId);

  const resetForm = () => {
    setName("");
    setCode("");
    setCredits("3");
    setExams({ ia1: false, ia2: false, ia3: false, see: false });
    setEditCourse(null);
  };

  useEffect(() => {
    if (editCourse) {
      setName(editCourse.name);
      setCode(editCourse.code);
      setCredits(String(editCourse.credits));
      setExams({ ...editCourse.exams });
    }
  }, [editCourse]);

  const handleOpenCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setEditCourse(course);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editCourse) {
      updateMutation.mutate(
        { id: editCourse._id, data: { name, code, credits: Number(credits), exams } },
        { onSuccess: handleCloseModal }
      );
    } else {
      createMutation.mutate(
        { name, code, credits: Number(credits), semester: semesterId, exams },
        { onSuccess: handleCloseModal }
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
    });
  };

  const toggleExam = (key: keyof CourseExams) =>
    setExams((prev) => ({ ...prev, [key]: !prev[key] }));

  const isEdit = !!editCourse;
  const mutation = isEdit ? updateMutation : createMutation;

  if (isLoading) return null;

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase text-gray-400">Courses</span>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          <Plus className="h-3 w-3" /> Add Course
        </button>
      </div>

      {!courses || courses.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-400">
          <Inbox className="h-4 w-4" /> No courses yet
        </div>
      ) : (
        <div className="space-y-1">
          {courses.map((c) => (
            <div
              key={c._id}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-gray-800">{c.code}</span>
                <span className="mx-2 text-gray-300">&mdash;</span>
                <span className="text-sm text-gray-600">{c.name}</span>
                <span className="ml-2 text-xs text-gray-400">({c.credits} cr)</span>
              </div>
              <div className="flex items-center gap-2">
                {EXAM_LABELS.map(({ key, label }) =>
                  c.exams[key] ? (
                    <span
                      key={key}
                      className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700"
                    >
                      {label}
                    </span>
                  ) : null
                )}
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="ml-2 rounded p-1 text-gray-300 hover:bg-blue-50 hover:text-blue-500"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteId(c._id)}
                  className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Course Modal */}
      <Modal open={modalOpen} onClose={handleCloseModal} title={isEdit ? "Edit Course" : "Add Course"}>
        {mutation.isError && <ErrorAlert message={mutation.error.message} />}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Course Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Data Structures" />
            <Input label="Course Code" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. CS301" />
          </div>
          <Input label="Credits" type="number" required min={1} value={credits} onChange={(e) => setCredits(e.target.value)} />
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Exam Types</label>
            <div className="flex gap-4">
              {EXAM_LABELS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-1.5 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={exams[key]}
                    onChange={() => toggleExam(key)}
                    className="rounded border-gray-300"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" isLoading={mutation.isPending}>
              {isEdit ? "Save Changes" : "Add Course"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title="Delete Course"
        message={`This will permanently delete "${deleteCourse?.code ?? ""} — ${deleteCourse?.name ?? ""}". This action cannot be undone.`}
      />
    </div>
  );
}
