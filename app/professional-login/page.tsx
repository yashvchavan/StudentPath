"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Briefcase, TrendingUp, Settings } from "lucide-react";
import Link from "next/link";
import { ActiveSessionBlock, useSessionBlock } from "@/components/ui/active-session-block";

const AnimatedBackground = () => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: "2s",
          }}
        />
      ))}
    </div>
  );
};

const ProfessionalLoader = () => (
  <div className="flex flex-col items-center justify-center py-4">
    <div className="relative">
      <div className="animate-pulse">
        <Briefcase className="w-12 h-12 text-yellow-400 drop-shadow-lg" style={{ filter: "drop-shadow(0 0 15px rgba(251, 191, 36, 0.6))" }} />
      </div>
      <div className="absolute inset-0 animate-ping">
        <Briefcase className="w-12 h-12 text-yellow-400/30" />
      </div>
    </div>
    <p className="text-white/80 text-sm mt-4 animate-pulse">Accessing professional portal...</p>
  </div>
);

export default function ProfessionalLoginPage() {
  const router = useRouter();
  const { isBlocked, isLoading: sessionLoading } = useSessionBlock('professional');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const professionalTestimonials = [
    { name: "Sarah Johnson", text: "Enhanced my skills and got promoted within 6 months!", position: "Software Engineer" },
    { name: "Michael Chen", text: "The career guidance helped me transition to a better role.", position: "Product Manager" },
    { name: "Emily Rodriguez", text: "Amazing networking opportunities and skill development.", position: "Data Scientist" },
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTestimonial((prev) => (prev + 1) % professionalTestimonials.length), 4000);
    return () => clearInterval(interval);
  }, [professionalTestimonials.length]);

  // Block access if logged in as another role - MUST be after all hooks
  if (isBlocked) {
    return <ActiveSessionBlock intendedRole="professional" pageName="Professional Login" />;
  }

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Please enter a valid email address";
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/professionals/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error || "Login failed");
        setIsLoading(false);
        return;
      }

      // small delay to ensure cookie is set before redirect
      await new Promise((resolve) => setTimeout(resolve, 100));

      router.push("/professional-dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setApiError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black text-white overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(251, 191, 36, 0.3) 0%, rgba(217, 119, 6, 0.2) 25%, transparent 50%)`,
            transition: "background 0.5s ease",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-yellow-900/20 to-orange-600/20" />
        <AnimatedBackground />
      </div>

      <div className="flex w-full">
        {/* Left Side */}
        <div className="hidden lg:flex lg:w-2/5 relative z-10 p-12 flex-col justify-between">
          <div
            className="absolute inset-0 h-screen bg-cover bg-center animate-[spin_60s_linear_infinite] scale-[2.0] translate-x-[-100px]"
            style={{ backgroundImage: "url('/moon.png')" }}
          />
          <div className="relative z-20">
            <div className="mb-16 mt-20">
              <h2 className="text-5xl font-bold mb-6 leading-tight">
                Advance Your Career,{" "}
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Unlock Potential
                </span>
              </h2>
              <p className="text-xl text-white/80 leading-relaxed">
                Professional development platform designed to accelerate your career growth through personalized learning paths, skill assessments, and industry connections.
              </p>
            </div>
          </div>

          {/* Testimonials */}
          <div className="relative z-20 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-white/90 font-medium">Professional Success Stories</span>
            </div>
            <div className="mb-4 transition-all duration-500">
              <p className="text-white/90 italic text-lg">"{professionalTestimonials[currentTestimonial].text}"</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">{professionalTestimonials[currentTestimonial].name}</p>
                <p className="text-gray-400 text-sm">{professionalTestimonials[currentTestimonial].position}</p>
              </div>
              <div className="flex gap-2">
                {professionalTestimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentTestimonial ? "bg-yellow-400 w-6" : "bg-white/30 hover:bg-white/50"
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8 relative z-10">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-yellow-500 to-orange-600">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-yellow-200">
                  StudentPath Professional
                </h1>
              </div>
            </div>

            <Card className="shadow-2xl backdrop-blur-xl border bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border-yellow-500/20">
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold text-white mb-2">Professional Portal</CardTitle>
                <CardDescription className="text-gray-300 text-lg">Continue your professional journey</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center min-h-[300px]">
                    <ProfessionalLoader />
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white font-medium">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-yellow-400 focus:ring-yellow-400/20"
                      />
                      {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white font-medium">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pr-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-yellow-400 focus:ring-yellow-400/20"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
                    </div>

                    {apiError && <p className="text-sm text-red-400">{apiError}</p>}

                    {/* Remember & Forgot */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember"
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                          className="border-white/20 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                        />
                        <Label htmlFor="remember" className="text-sm text-gray-300">Remember me</Label>
                      </div>
                      <Link href="/forgot-password?type=professional" className="text-sm font-medium text-yellow-400 hover:text-yellow-300">Forgot password?</Link>
                    </div>

                    <Button
                      type="submit"
                      className="w-full font-semibold py-3 rounded-xl transform hover:scale-[1.02] transition-all duration-300 shadow-2xl group bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
                      disabled={isLoading}
                    >
                      <Briefcase className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                      {isLoading ? "Accessing Portal..." : "Access Portal"}
                    </Button>
                    <div className="text-center space-y-2">
                      <p className="text-sm text-gray-400">
                        Don't have an account?{" "}
                        <Link href="/register-other" className="text-yellow-400 hover:text-yellow-300 font-medium underline">
                          Sign up for free
                        </Link>
                      </p>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
