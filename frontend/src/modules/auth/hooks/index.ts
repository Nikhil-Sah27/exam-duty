import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, getMe } from "../services";
import { useAuthStore } from "@/shared/store/auth.store";
import { LoginRequest, RegisterRequest } from "../types";

export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: LoginRequest) => loginUser(data),
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.token);
      navigate("/");
    },
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: RegisterRequest) => registerUser(data),
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.token);
      navigate("/");
    },
  });
};

export const useMe = () => {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    enabled: !!token,
    retry: false,
  });
};
