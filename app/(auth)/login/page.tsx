"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { supabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import TiltedCard from "@/components/TiltedCard";
import logo from "@/public/logo.png";
import { Marquee } from "@/components/ui/marquee";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      const user = data?.user;

      if (!user) {
        setError("No user returned.");
        return;
      }

      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message);
        return;
      }

    router.replace("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: "HD",
      subtitle: "Video calls",
      border: "border-[#9e70fc]/10",
      text: "text-[#9e70fc]",
    },
    {
      title: "24/7",
      subtitle: "Access",
      border: "border-[#F3B5D3]/20",
      text: "text-[#d985b1]",
    },
    {
      title: "SSL",
      subtitle: "Protected",
      border: "border-[#9e70fc]/10",
      text: "text-[#9e70fc]",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f8fb] flex text-gray-950 transition-colors dark:bg-[#0f1020] dark:text-white">
      {/* LEFT SIDE */}
      <section className="hidden  md:flex md:w-1/2 p-6 lg:py-10 lg:pl-20 ">
        <div className="relative flex min-h-full w-full overflow-hidden rounded-[2rem] bg-[#EEE5FF] px-10 py-8 shadow-2xl dark:bg-[#19172b]">
          <div className="absolute inset-0 bg-[linear-gradient(145deg,#A77BFF_0%,#C6A8FF_50%,#E9A7C8_100%)]" />
          <div className="relative z-10 flex w-full flex-col justify-between">
            <div>
              {/* <div className="inline-flex items-center rounded-full border border-[#9e70fc]/15 bg-white/65 px-4 py-2 text-sm font-medium text-[#7b55d8] shadow-sm backdrop-blur">
          Secure workspace access
        </div> */}

              <h1 className="max-w-md text-4xl font-semibold tracking-normal text-gray-950 lg:text-3xl dark:text-white">
                Seamless video collaboration in real time.
              </h1>

              <p className="mt-4 max-w-sm text-sm leading-6 text-gray-500 dark:text-white/65">
                Connect, communicate, and create with high-fidelity WebRTC technology built for modern teams.
              </p>
            </div>

            <div className="flex flex-1 items-center justify-center ">
              <div className="relative">
                <div className="absolute inset-0 scale-110 rounded-[2rem] bg-[#9e70fc]/10 blur-2xl" />

                <TiltedCard
                  imageSrc={logo.src}
                  altText="Logo"
                  captionText="WebRTC"
                  containerHeight="300px"
                  containerWidth="300px"
                  imageHeight="300px"
                  imageWidth="300px"
                  rotateAmplitude={14}
                  scaleOnHover={1.07}
                  showMobileWarning={false}
                  showTooltip
                  displayOverlayContent
                  overlayContent={<p className="tilted-card-demo-text"></p>}
                />
              </div>
            </div>

            <Marquee
              pauseOnHover
              className="[--duration:18s] [--gap:1.5rem]"
            >
              {stats.map((card) => (
                <div
                  key={card.title}
                  className={`w-[160px] rounded-2xl border ${card.border} bg-white/65 px-10 py-2 text-center shadow-sm backdrop-blur dark:bg-white/10`}
                >
                  <p className={`text-2xl font-semibold ${card.text}`}>
                    {card.title}
                  </p>

                  <p className="text-xs text-gray-500 dark:text-white/55">
                    {card.subtitle}
                  </p>
                </div>
              ))}
            </Marquee>
          </div>
        </div>
      </section>

      {/* RIGHT SIDE */}
      <section className="flex w-full items-center justify-center px-5 py-8 md:w-1/2 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            {/* <p className="mb-3 text-sm font-medium text-primary">Sign in</p> */}

            <h2 className="text-3xl font-semibold tracking-normal text-gray-950 dark:text-white">
              Sign In
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-white/60">
              Enter your credentials to continue to your workspace.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-white/70">Email</label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/40" />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="h-12 rounded-xl border-gray-200 bg-white pl-10 shadow-sm transition focus-visible:ring-2 focus-visible:ring-primary/25 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/35"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-white/70">
                Password
              </label>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/40" />

                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-gray-200 bg-white pl-10 pr-11 shadow-sm transition focus-visible:ring-2 focus-visible:ring-primary/25 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/35"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 rounded-md p-1 -translate-y-1/2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:text-white/45 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              disabled={loading}
              type="submit"
              className="mt-3 h-12 w-full rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 transition hover:translate-y-[-1px] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
