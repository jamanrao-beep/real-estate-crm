"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;
      login(token, user);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-3">
          <div className="w-48 sm:w-56 rounded-2xl overflow-hidden shadow-lg border border-border/40 bg-white p-3 transition-transform hover:scale-105 duration-200">
            <img
              src="/logo.png"
              alt="Badri Kedar Developers Logo"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-serif text-ink font-bold tracking-tight">
          BKD CRM
        </h2>
        <p className="mt-1 text-center text-xs tracking-widest text-accent uppercase font-semibold">
          Badri Kedar Developers
        </p>
        <p className="mt-1 text-center text-xs sm:text-sm text-ink-soft">
          Sign in to access your ledger workspace
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-6 px-4 border border-border rounded-xl shadow-sm sm:py-8 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-danger/10 border border-danger/20 rounded-md p-3 flex items-start gap-2 text-sm text-danger">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-ink mb-1"
              >
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@bkdcrm.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-ink mb-1"
              >
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
