import api from "@/shared/lib/api";
import { CreateExamsStatusResponse } from "../types";

export const fetchCreateExamsStatus = async (): Promise<string> => {
  const res = await api.get<CreateExamsStatusResponse>("/create-exams");
  return res.data.message;
};

export {
  fetchDepartmentsData,
  fetchCIERooms,
  createCIEPlan,
  assignCIERooms,
} from "./examService";
