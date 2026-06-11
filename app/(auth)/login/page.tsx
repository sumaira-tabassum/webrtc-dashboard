"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User } from "lucide-react";
import { login } from "@/lib/auth";
import { supabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("LOGIN ERROR:", error.message);
      return;
    }

    const user = data?.user;

    if (!user) {
      console.log("No user returned");
      return;
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    console.log("PROFILE ERROR:", profileError);

    if (profileError) {
      console.log("PROFILE ERROR:", profileError.message);
      return;
    }

    if (profile?.role === "admin") {
      router.replace("/users");
    } else {
      router.replace("/meet");
    }
  };

  return (
    <main className="min-h-screen flex">

      {/* LEFT SIDE */}
      <section className="hidden md:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-12 flex-col justify-between">

        {/* decorative blobs */}
        <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-indigo-400 to-purple-500 blur-[120px] opacity-20 rounded-full top-[-10%] left-[-10%]" />
        <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-purple-400 to-pink-500 blur-[120px] opacity-20 rounded-full bottom-[-10%] right-[-10%]" />

        {/* branding */}
        <div className="relative z-10 text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">

        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            Seamless video collaboration in real time
          </h1>
          <p className="mt-4 text-gray-600 text-lg">
            Connect, communicate, and create with high-fidelity WebRTC technology built for modern teams.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {/* <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white" />
            <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white" />
            <div className="w-8 h-8 rounded-full bg-gray-500 border-2 border-white" /> */}
          </div>
          <span className="text-sm text-gray-500">
            Trusted by 50k+ teams worldwide
          </span>
        </div>
      </section>

      {/* RIGHT SIDE */}
      <section className="w-full md:w-1/2 flex items-center justify-center bg-white p-6">

        <div className="w-full max-w-md rounded-2xl border shadow-xl p-8 bg-white">

          {/* header */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Welcome Back
            </h2>
            <p className="text-gray-500 mt-1">
              Sign in to continue to your workspace
            </p>
          </div>

          {/* form */}
          <form className="space-y-4" onSubmit={handleLogin}>

            {/* email */}
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* password */}
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* button */}
            <Button
              type="submit"
              className="
    w-full
    h-11
    border-purple-600
    text-white
    bg-purple-600
    transition-colors
  "
            >
              Sign In
            </Button>

            {/* divider */}
            {/* <div className="flex items-center gap-4">
              <div className="h-px bg-gray-200 flex-1" />
              <span className="text-xs text-gray-400">OR</span>
              <div className="h-px bg-gray-200 flex-1" />
            </div> */}

            {/* demo */}
            {/* <Button variant="outline" className="w-full h-11 gap-2">
              <User className="h-4 w-4" />
              Continue as demo user
            </Button> */}

          </form>

          {/* footer */}
          {/* <p className="text-center text-sm text-gray-500 mt-6">
            Don’t have an account?{" "}
            <span className="text-indigo-600 font-medium cursor-pointer">
              Get started
            </span>
          </p> */}

        </div>
      </section>

    </main>
  );
}