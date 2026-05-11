
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateChangeRequest } from "../hooks";
import { useDuties } from "@/modules/duties/hooks";
import { useUsers } from "@/modules/users/hooks";
import { useAuthStore } from "@/shared/store/auth.store";
import { Modal, ErrorAlert } from "@/shared/components";
import { formatDate } from "@/shared/lib/utils";

const schema = z
  .object({
    duty: z.string().min(1, "Duty is required"),
    type: z.enum(["swap", "drop"], { error: "Type is required" }),
    reason: z.string().min(1, "Reason is required"),
    swapWith: z.string().optional(),
  })
  .refine(
    (data) => data.type !== "swap" || (data.swapWith && data.swapWith.length > 0),
    { message: "Swap target is required for swap requests", path: ["swapWith"] }
  );

type FormValues = z.infer<typeof schema>;

interface CreateRequestModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateRequestModal({
  open,
  onClose,
}: CreateRequestModalProps) {
  const user = useAuthStore((s) => s.user);
  const { data: duties } = useDuties();
  const { data: users } = useUsers();
  const createMutation = useCreateChangeRequest();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { duty: "", type: "drop", reason: "", swapWith: "" },
  });

  const requestType = watch("type");

  // Only show duties assigned to the current user
  const myDuties = (duties || []).filter(
    (d) => d.teacher._id === user?.id && d.status === "assigned"
  );

  // Exclude current user from swap targets
  const swapTargets = (users || []).filter((u) => u._id !== user?.id);

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(
      {
        duty: data.duty,
        type: data.type,
        reason: data.reason,
        swapWith: data.type === "swap" ? data.swapWith : undefined,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="New Change Request">
      {createMutation.isError && (
        <ErrorAlert message={createMutation.error.message} />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Duty */}
        <div>
          <label
            htmlFor="duty"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Duty
          </label>
          <select
            id="duty"
            {...register("duty")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select a duty...</option>
            {myDuties.map((d) => (
              <option key={d._id} value={d._id}>
                {d.exam.name} — {d.room} — {formatDate(d.date)}
              </option>
            ))}
          </select>
          {errors.duty && (
            <p className="mt-1 text-xs text-red-600">{errors.duty.message}</p>
          )}
        </div>

        {/* Type */}
        <div>
          <label
            htmlFor="type"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Request Type
          </label>
          <select
            id="type"
            {...register("type")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="drop">Drop</option>
            <option value="swap">Swap</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-xs text-red-600">{errors.type.message}</p>
          )}
        </div>

        {/* Swap target — only for swap type */}
        {requestType === "swap" && (
          <div>
            <label
              htmlFor="swapWith"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Swap With
            </label>
            <select
              id="swapWith"
              {...register("swapWith")}
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select teacher...</option>
              {swapTargets.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.department || "No dept"})
                </option>
              ))}
            </select>
            {errors.swapWith && (
              <p className="mt-1 text-xs text-red-600">
                {errors.swapWith.message}
              </p>
            )}
          </div>
        )}

        {/* Reason */}
        <div>
          <label
            htmlFor="reason"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Reason
          </label>
          <textarea
            id="reason"
            {...register("reason")}
            rows={3}
            className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Explain why you need this change..."
          />
          {errors.reason && (
            <p className="mt-1 text-xs text-red-600">
              {errors.reason.message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createMutation.isPending ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
