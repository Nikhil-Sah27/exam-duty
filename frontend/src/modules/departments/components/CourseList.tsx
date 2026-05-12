import { useState, useEffect, FormEvent } from "react";
import { Plus, Trash2, Pencil, Inbox, Users, ChevronDown, ChevronRight } from "lucide-react";
import {
  useCourses,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  useElectiveGroups,
  useCreateElectiveGroup,
  useDeleteElectiveGroup,
} from "../hooks";
import type { Course, CourseExams, CourseType, ElectiveGroup } from "../types";
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

const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  core: "Core",
  professional_elective: "Professional Elective",
  open_elective: "Open Elective",
};

function CourseRow({
  course,
  onEdit,
  onDelete,
  showStudentCount,
}: {
  course: Course;
  onEdit: (c: Course) => void;
  onDelete: (id: string) => void;
  showStudentCount?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-gray-800">{course.code}</span>
        <span className="mx-2 text-gray-300">&mdash;</span>
        <span className="text-sm text-gray-600">{course.name}</span>
        <span className="ml-2 text-xs text-gray-400">({course.credits} cr)</span>
        {showStudentCount && course.studentCount > 0 && (
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600">
            <Users className="h-3 w-3" />
            {course.studentCount}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {EXAM_LABELS.map(({ key, label }) =>
          course.exams[key] ? (
            <span
              key={key}
              className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700"
            >
              {label}
            </span>
          ) : null
        )}
        <button
          onClick={() => onEdit(course)}
          className="ml-2 rounded p-1 text-gray-300 hover:bg-blue-50 hover:text-blue-500"
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(course._id)}
          className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function ElectiveGroupSection({
  group,
  onEditCourse,
  onDeleteCourse,
  onDeleteGroup,
  onAddCourse,
}: {
  group: ElectiveGroup;
  onEditCourse: (c: Course) => void;
  onDeleteCourse: (id: string) => void;
  onDeleteGroup: (id: string) => void;
  onAddCourse: (groupId: string, groupType: "professional" | "open") => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const typeLabel = group.type === "professional" ? "PE" : "OE";
  const typeBg = group.type === "professional" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700";
  const totalStudents = group.courses.reduce((sum, c) => sum + (c.studentCount || 0), 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div
        className="flex cursor-pointer items-center gap-2 px-4 py-2.5 transition-colors hover:bg-gray-50/50"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        )}
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${typeBg}`}>{typeLabel}</span>
        <span className="text-sm font-medium text-gray-700">{group.name}</span>
        <span className="text-xs text-gray-400">
          ({group.courses.length} options, {totalStudents} students)
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddCourse(group._id, group.type);
            }}
            className="rounded p-1 text-gray-300 hover:bg-blue-50 hover:text-blue-500"
            title="Add course to group"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteGroup(group._id);
            }}
            className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
            title="Delete group"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="space-y-1 border-t border-gray-100 px-3 py-2">
          {group.courses.length === 0 ? (
            <p className="px-2 py-1 text-xs text-gray-400">No courses in this group yet</p>
          ) : (
            group.courses.map((c) => (
              <CourseRow
                key={c._id}
                course={c}
                onEdit={onEditCourse}
                onDelete={onDeleteCourse}
                showStudentCount
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function CourseList({ semesterId, deptId }: CourseListProps) {
  const { data: courses, isLoading } = useCourses(semesterId);
  const { data: electiveGroups } = useElectiveGroups(semesterId);
  const createMutation = useCreateCourse(semesterId, deptId);
  const updateMutation = useUpdateCourse(semesterId, deptId);
  const deleteMutation = useDeleteCourse(semesterId, deptId);
  const createGroupMutation = useCreateElectiveGroup(semesterId, deptId);
  const deleteGroupMutation = useDeleteElectiveGroup(semesterId, deptId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);

  // Course form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [credits, setCredits] = useState("3");
  const [exams, setExams] = useState<CourseExams>({ ia1: false, ia2: false, ia3: false, see: false });
  const [courseType, setCourseType] = useState<CourseType>("core");
  const [electiveGroupId, setElectiveGroupId] = useState<string>("");
  const [studentCount, setStudentCount] = useState("0");

  // Group form state
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState<"professional" | "open">("professional");

  const courseToDelete = courses?.find((c) => c._id === deleteId);
  const coreCourses = courses?.filter((c) => c.courseType === "core" || !c.courseType) ?? [];

  const resetForm = () => {
    setName("");
    setCode("");
    setCredits("3");
    setExams({ ia1: false, ia2: false, ia3: false, see: false });
    setCourseType("core");
    setElectiveGroupId("");
    setStudentCount("0");
    setEditCourse(null);
  };

  useEffect(() => {
    if (editCourse) {
      setName(editCourse.name);
      setCode(editCourse.code);
      setCredits(String(editCourse.credits));
      setExams({ ...editCourse.exams });
      setCourseType(editCourse.courseType || "core");
      const egId = typeof editCourse.electiveGroup === "object" && editCourse.electiveGroup
        ? editCourse.electiveGroup._id
        : editCourse.electiveGroup || "";
      setElectiveGroupId(egId as string);
      setStudentCount(String(editCourse.studentCount || 0));
    }
  }, [editCourse]);

  const handleOpenCreate = (groupId?: string, gType?: "professional" | "open") => {
    resetForm();
    if (groupId && gType) {
      setCourseType(gType === "professional" ? "professional_elective" : "open_elective");
      setElectiveGroupId(groupId);
    }
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
    const payload = {
      name,
      code,
      credits: Number(credits),
      semester: semesterId,
      exams,
      courseType,
      electiveGroup: courseType !== "core" ? electiveGroupId || null : null,
      studentCount: courseType !== "core" ? Number(studentCount) : 0,
    };

    if (editCourse) {
      updateMutation.mutate(
        { id: editCourse._id, data: payload },
        { onSuccess: handleCloseModal }
      );
    } else {
      createMutation.mutate(payload, { onSuccess: handleCloseModal });
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  };

  const handleCreateGroup = (e: FormEvent) => {
    e.preventDefault();
    createGroupMutation.mutate(
      { name: groupName, type: groupType, semester: semesterId },
      {
        onSuccess: () => {
          setGroupModalOpen(false);
          setGroupName("");
        },
      }
    );
  };

  const handleConfirmDeleteGroup = () => {
    if (!deleteGroupId) return;
    deleteGroupMutation.mutate(deleteGroupId, {
      onSuccess: () => setDeleteGroupId(null),
    });
  };

  const toggleExam = (key: keyof CourseExams) =>
    setExams((prev) => ({ ...prev, [key]: !prev[key] }));

  const isEdit = !!editCourse;
  const mutation = isEdit ? updateMutation : createMutation;
  const isElective = courseType !== "core";

  if (isLoading) return null;

  return (
    <div className="mt-3 space-y-4">
      {/* ── Core Courses ── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase text-gray-400">Core Courses</span>
          <button
            onClick={() => handleOpenCreate()}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-3 w-3" /> Add Core Course
          </button>
        </div>

        {coreCourses.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-400">
            <Inbox className="h-4 w-4" /> No core courses yet
          </div>
        ) : (
          <div className="space-y-1">
            {coreCourses.map((c) => (
              <CourseRow key={c._id} course={c} onEdit={handleOpenEdit} onDelete={setDeleteId} />
            ))}
          </div>
        )}
      </div>

      {/* ── Elective Groups ── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase text-gray-400">Elective Groups</span>
          <button
            onClick={() => setGroupModalOpen(true)}
            className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-800"
          >
            <Plus className="h-3 w-3" /> Add Elective Group
          </button>
        </div>

        {!electiveGroups || electiveGroups.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-400">
            <Inbox className="h-4 w-4" /> No elective groups yet
          </div>
        ) : (
          <div className="space-y-2">
            {electiveGroups.map((g) => (
              <ElectiveGroupSection
                key={g._id}
                group={g}
                onEditCourse={handleOpenEdit}
                onDeleteCourse={setDeleteId}
                onDeleteGroup={setDeleteGroupId}
                onAddCourse={handleOpenCreate}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Add / Edit Course Modal ── */}
      <Modal open={modalOpen} onClose={handleCloseModal} title={isEdit ? "Edit Course" : "Add Course"}>
        {mutation.isError && <ErrorAlert message={mutation.error.message} />}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Course Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Data Structures" />
            <Input label="Course Code" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. CS301" />
          </div>
          <Input label="Credits" type="number" required min={1} value={credits} onChange={(e) => setCredits(e.target.value)} />

          {/* Course Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Course Type</label>
            <div className="flex gap-3">
              {(["core", "professional_elective", "open_elective"] as CourseType[]).map((t) => (
                <label key={t} className="flex items-center gap-1.5 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="courseType"
                    checked={courseType === t}
                    onChange={() => {
                      setCourseType(t);
                      if (t === "core") setElectiveGroupId("");
                    }}
                    className="border-gray-300"
                  />
                  {COURSE_TYPE_LABELS[t]}
                </label>
              ))}
            </div>
          </div>

          {/* Elective Group selector + Student Count */}
          {isElective && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Elective Group</label>
                <select
                  value={electiveGroupId}
                  onChange={(e) => setElectiveGroupId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select group...</option>
                  {(electiveGroups ?? [])
                    .filter(
                      (g) =>
                        (courseType === "professional_elective" && g.type === "professional") ||
                        (courseType === "open_elective" && g.type === "open")
                    )
                    .map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name}
                      </option>
                    ))}
                </select>
              </div>
              <Input
                label="Students Opted"
                type="number"
                required
                min={0}
                value={studentCount}
                onChange={(e) => setStudentCount(e.target.value)}
                placeholder="How many students chose this subject"
              />
            </>
          )}

          {/* Exam Types */}
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

      {/* ── Create Elective Group Modal ── */}
      <Modal open={groupModalOpen} onClose={() => setGroupModalOpen(false)} title="Create Elective Group">
        {createGroupMutation.isError && <ErrorAlert message={createGroupMutation.error.message} />}
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <Input
            label="Group Name"
            required
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Professional Elective 1"
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm text-gray-700">
                <input
                  type="radio"
                  name="groupType"
                  checked={groupType === "professional"}
                  onChange={() => setGroupType("professional")}
                  className="border-gray-300"
                />
                Professional Elective
              </label>
              <label className="flex items-center gap-1.5 text-sm text-gray-700">
                <input
                  type="radio"
                  name="groupType"
                  checked={groupType === "open"}
                  onChange={() => setGroupType("open")}
                  className="border-gray-300"
                />
                Open Elective
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setGroupModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createGroupMutation.isPending}>Create Group</Button>
          </div>
        </form>
      </Modal>

      {/* ── Confirm Delete Course ── */}
      <ConfirmDeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title="Delete Course"
        message={`This will permanently delete "${courseToDelete?.code ?? ""} — ${courseToDelete?.name ?? ""}". This action cannot be undone.`}
      />

      {/* ── Confirm Delete Elective Group ── */}
      <ConfirmDeleteModal
        open={!!deleteGroupId}
        onClose={() => setDeleteGroupId(null)}
        onConfirm={handleConfirmDeleteGroup}
        isLoading={deleteGroupMutation.isPending}
        title="Delete Elective Group"
        message="This will delete the group. Courses in it will become core courses. This cannot be undone."
      />
    </div>
  );
}
