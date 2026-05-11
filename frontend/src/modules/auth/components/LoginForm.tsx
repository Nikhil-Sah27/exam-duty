
import { useState, FormEvent } from "react";
import { useLogin } from "../hooks";
import { Input, Button, ErrorAlert } from "@/shared/components";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md"
      >
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Login
        </h2>

        {login.isError && <ErrorAlert message={login.error.message} />}

        <div className="mb-4">
          <Input
            id="email"
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="mb-6">
          <Input
            id="password"
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <Button
          type="submit"
          isLoading={login.isPending}
          className="w-full"
        >
          Sign In
        </Button>
      </form>
    </div>
  );
}
