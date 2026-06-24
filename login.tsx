




"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, Loader2, Eye, EyeOff } from "lucide-react";
import { login } from "@/lib/auth";
import { supabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import TiltedCard from "@/components/TiltedCard";
import logo from "@/public/logo.png";
import Grainient from "@/components/Grainient";

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
        console.log("LOGIN ERROR:" + error.message);
        setError(error.message);
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
        console.log("PROFILE ERROR:" + profileError.message);
        return;
      }
      if (profile?.role === "admin") {
        router.replace("/users");
      } else {
        router.replace("/meet");
      }
    }
    finally {
      setLoading(false);
    }

  };

  return (
    <main className="min-h-screen flex">

      {/* LEFT SIDE */}
   <section
  className="
    hidden md:flex
    md:w-1/2
    relative overflow-hidden
    p-8 lg:p-12
    flex-col justify-between
  "
>
  <div className="relative w-full h-[600px]">
    {/* Background */}
    <div className="relative w-full h-[550px] rounded-3xl overflow-hidden">
      <Grainient
        color1="#c4acf3"
        color2="#fcd0e5"
        color3="#ceb8fa"
        timeSpeed={0.25}
        colorBalance={0}
        warpStrength={1}
        warpFrequency={5}
        warpSpeed={2}
        warpAmplitude={50}
        blendAngle={0}
        blendSoftness={0.05}
        rotationAmount={500}
        noiseScale={2}
        grainAmount={0.1}
        grainScale={2}
        grainAnimated={false}
        contrast={1.5}
        gamma={1}
        saturation={1}
        centerX={0}
        centerY={0}
        zoom={0.9}
      />
    </div>

    {/* Card */}
    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <TiltedCard
        imageSrc={logo.src}
        altText="Logo"
        captionText="WebRTC"
        containerHeight="300px"
        containerWidth="300px"
        imageHeight="300px"
        imageWidth="300px"
        rotateAmplitude={12}
        scaleOnHover={1.05}
        showMobileWarning={false}
        showTooltip
        displayOverlayContent
        overlayContent={<p className="tilted-card-demo-text"></p>}
      />
    </div>
  </div>
</section>

      {/* RIGHT SIDE */}
      <section
        className="
    w-full md:w-1/2
    flex items-center justify-center
    bg-white
    px-4 py-6
    sm:px-6
  "
      >
        {/* className="
    w-full
    max-w-md
    border
    bg-white/60
    p-6 sm:p-8
    rounded-3xl  
    bg-white/80 
    shadow-2xl 
    backdrop-blur-xl 
  " */}

        <div
          
        >

          {/* header */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Welcome Back
            </h2>
            <p className="mt-1 text-sm sm:text-base text-gray-500">
              Sign in to continue to your workspace
            </p>
          </div>

          {/* form */}
          <form className="space-y-6" onSubmit={handleLogin}>

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
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600">
                {error}
              </div>
            )}

            {/* button */}
            <Button
              disabled={loading}
              type="submit"
              className="
              w-full
              h-12
              bg-primary
              text-white
              border-primary
              transition-colors
              my-8
              "
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}

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