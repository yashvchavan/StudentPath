"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  User,
  GraduationCap,
  Target,
  Award,
  MapPin,
  Calendar,
  Rocket,
  Briefcase,
  Users,
  Building,
  Landmark,
  TrendingUp,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import { ActiveSessionBlock, useSessionBlock } from "@/components/ui/active-session-block";

// === Animated Background ===
const AnimatedBackground = () => {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; delay: number; size: number }>
  >([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      size: Math.random() * 2 + 1,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Glow effects */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px]"
        style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 70%)" }}
      />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px]"
        style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }}
      />

      {/* Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: p.delay,
          }}
          className="absolute rounded-full bg-blue-400"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            filter: "blur(0.5px)",
            boxShadow: "0 0 10px rgba(96, 165, 250, 0.5)",
          }}
        />
      ))}
    </div>
  );
};

// === User Type Selection Component ===
const UserTypeSelection = ({ onSelect }: { onSelect: (type: 'professional' | 'college') => void }) => {
  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#030309] overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#34d399]">
              Registration
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">
            <span className="text-white">Choose Your </span>
            <span
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #f59e0b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              Path
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Select the account type that best matches your needs and start your journey with StudentPath.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* College Card */}
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            className="group"
          >
            <Card
              className="relative cursor-pointer transition-all duration-500 border-white/10 bg-white/5 backdrop-blur-2xl overflow-hidden rounded-[2rem]"
              onClick={() => onSelect('college')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <CardContent className="p-10 relative z-10">
                <div className="flex justify-center mb-8">
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform duration-500"
                  >
                    <Landmark className="w-10 h-10 text-white" />
                  </motion.div>
                </div>

                <h2 className="text-3xl font-bold text-center mb-4 text-white">
                  College / University
                </h2>

                <p className="text-gray-400 text-center mb-8 text-lg leading-relaxed">
                  For educational institutions to manage students, curriculum, and career guidance.
                </p>

                <div className="flex flex-col gap-4">
                  <Button
                    className="w-full h-14 rounded-xl text-white font-bold text-lg transition-all duration-300 relative overflow-hidden group"
                    style={{
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      boxShadow: "0 10px 20px -10px rgba(16, 185, 129, 0.5)",
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Continue as College
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                  
                  <p className="text-gray-500 text-sm text-center">
                    Already have an account?{" "}
                    <Link href="/college-login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                      Sign in
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Professional Card */}
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            className="group"
          >
            <Card
              className="relative cursor-pointer transition-all duration-500 border-white/10 bg-white/5 backdrop-blur-2xl overflow-hidden rounded-[2rem]"
              onClick={() => onSelect('professional')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <CardContent className="p-10 relative z-10">
                <div className="flex justify-center mb-8">
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    className="w-20 h-20 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:-rotate-6 transition-transform duration-500"
                  >
                    <User className="w-10 h-10 text-white" />
                  </motion.div>
                </div>

                <h2 className="text-3xl font-bold text-center mb-4 text-white">
                  Professional
                </h2>

                <p className="text-gray-400 text-center mb-8 text-lg leading-relaxed">
                  For individuals looking to boost their career, manage skills, and find opportunities.
                </p>

                <div className="flex flex-col gap-4">
                  <Button
                    className="w-full h-14 rounded-xl text-white font-bold text-lg transition-all duration-300 relative overflow-hidden group"
                    style={{
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      boxShadow: "0 10px 20px -10px rgba(245, 158, 11, 0.5)",
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Continue as Professional
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>

                  <p className="text-gray-500 text-sm text-center">
                    Already have an account?{" "}
                    <Link href="/professional-login" className="text-amber-400 hover:text-amber-300 font-medium">
                      Sign in
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// === Rocket Progress ===
const RocketProgress = ({ progress, isCollege }: { progress: number; isCollege?: boolean }) => {
  const roundedProgress = Math.round(progress);
  
  return (
    <div className="relative w-full py-8">
      {/* Background Track */}
      <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
        {/* Progress Bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={`h-full relative ${
            isCollege 
              ? 'bg-gradient-to-r from-emerald-600 via-green-500 to-teal-400' 
              : 'bg-gradient-to-r from-amber-600 via-yellow-500 to-orange-400'
          }`}
        >
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-shimmer" />
        </motion.div>
      </div>

      {/* Floating Rocket & Percentage */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out z-20"
        style={{ left: `calc(${progress}% - 20px)` }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <div className="relative flex flex-col items-center group">
          {/* Tooltip-style Percentage */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-2 px-2 py-0.5 rounded-md text-[10px] font-black tracking-tighter shadow-xl border ${
              isCollege 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}
          >
            {roundedProgress}%
          </motion.div>

          <div className="relative">
            <Rocket 
              className={`w-6 h-6 rotate-45 transition-colors duration-500 ${
                isCollege ? 'text-emerald-400 fill-emerald-500/20' : 'text-amber-400 fill-amber-500/20'
              }`} 
            />
            {/* Engine Flare */}
            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-4 blur-sm rounded-full animate-pulse ${
              isCollege ? 'bg-emerald-500/60' : 'bg-amber-500/60'
            }`} />
            
            {/* Dynamic Glow */}
            <div className={`absolute -inset-4 blur-2xl rounded-full opacity-40 animate-pulse ${
              isCollege ? 'bg-emerald-500' : 'bg-amber-500'
            }`} />
          </div>
        </div>
      </motion.div>

      {/* Milestone Dots */}
      {[0, 25, 50, 75, 100].map((pos) => (
        <div 
          key={pos}
          className="absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/20"
          style={{ left: `${pos}%` }}
        />
      ))}
    </div>
  );
};

// === Transition Wrapper ===
const StepTransition = ({
  children,
  isActive,
}: {
  children: React.ReactNode;
  isActive: boolean;
}) => (
  <div
    className={`transition-all duration-500 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
  >
    {children}
  </div>
);

// === Rocket Launch Loader ===
const RocketLaunchLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative mb-8">
        <div className="animate-bounce" style={{ animationDuration: "2s" }}>
          <Rocket className="w-24 h-24 text-indigo-500" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-yellow-400 bg-clip-text text-transparent">
          Launching Your Journey...
        </h3>
        <p className="text-gray-400 animate-pulse">Creating your personalized path</p>
      </div>
    </div>
  );
};

// Common data
const colleges = [
  "IIT Delhi",
  "IIT Bombay",
  "IIT Madras",
  "IIT Kanpur",
  "IIT Kharagpur",
  "BITS Pilani",
  "NIT Warangal",
  "NIT Trichy",
  "IIIT Hyderabad",
  "VIT Vellore",
];

const programs = [
  "Computer Science Engineering",
  "Information Technology",
  "Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Business Administration",
  "Economics",
];

const academicInterestOptions = [
  "Artificial Intelligence",
  "Web Development",
  "Data Science",
  "Cybersecurity",
  "Mobile Development",
  "Cloud Computing",
  "Machine Learning",
  "Blockchain",
  "UI/UX Design",
  "Digital Marketing",
  "Finance",
  "Management",
];
const careerQuestions = [
  {
    id: "work_environment",
    question: "What type of work environment ignites your passion?",
    options: [
      { value: "startup", label: "Fast-paced startup environment", icon: "🚀" },
      { value: "corporate", label: "Structured corporate setting", icon: "🏢" },
      { value: "remote", label: "Remote/flexible work", icon: "🏠" },
      { value: "research", label: "Research and academic institutions", icon: "🔬" },
    ],
  },
  {
    id: "problem_solving",
    question: "How do you prefer to conquer challenges?",
    options: [
      { value: "analytical", label: "Through data and analysis", icon: "📊" },
      { value: "creative", label: "Through creative thinking", icon: "🎨" },
      { value: "collaborative", label: "Through team collaboration", icon: "👥" },
      { value: "systematic", label: "Through systematic processes", icon: "⚙️" },
    ],
  },
  {
    id: "career_focus",
    question: "What drives your career ambitions most?",
    options: [
      { value: "impact", label: "Making a positive impact", icon: "🌟" },
      { value: "growth", label: "Rapid career growth", icon: "📈" },
      { value: "stability", label: "Job security and stability", icon: "🛡️" },
      { value: "innovation", label: "Working on cutting-edge technology", icon: "💡" },
    ],
  },
];

const technicalSkillsList = [
  "Python",
  "JavaScript",
  "Java",
  "C++",
  "React",
  "Node.js",
  "SQL",
  "Git",
  "AWS",
  "Docker",
  "Machine Learning",
  "Data Analysis",
];

const softSkillsList = [
  "Communication",
  "Leadership",
  "Time Management",
  "Problem Solving",
  "Teamwork",
  "Adaptability",
  "Critical Thinking",
  "Project Management",
];

const languagesList = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Marathi",
  "Gujarati",
];

const companies = [
  "Google",
  "Microsoft",
  "Amazon",
  "Apple",
  "Meta",
  "Netflix",
  "Adobe",
  "Salesforce",
  "IBM",
  "Oracle",
  "Accenture",
  "TCS",
  "Infosys",
  "Wipro",
  "Other",
];

const industries = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "E-commerce",
  "Manufacturing",
  "Consulting",
  "Media & Entertainment",
  "Telecommunications",
  "Energy",
];

// === Student Registration Component ===
const StudentRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    studentId: "",
    dateOfBirth: "",
    gender: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    college: "",
    program: "",
    currentYear: "",
    currentSemester: "",
    enrollmentYear: "",
    currentGPA: [7.5],
    academicInterests: [] as string[],
    firstName: "",
    lastName: "",
    email: "",
    phone: "",

    careerQuizAnswers: {} as { [key: string]: string },

    technicalSkills: {},
    softSkills: {},
    languageSkills: {},

    primaryGoal: "",
    secondaryGoal: "",
    timeline: "",
    locationPreference: "",
    industryFocus: [] as string[],

    intensityLevel: "moderate",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const [error, setError] = useState<string>("")
  const updateFormData = (updates: any) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep((s) => s + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true)
    setError("")

    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        throw new Error("Please fill in all required fields")
      }

      if (!formData.agreeToTerms) {
        throw new Error("Please agree to the terms and conditions")
      }

      // Get college token from URL
      const urlParams = new URLSearchParams(window.location.search);
      const collegeToken = urlParams.get('token');

      // Make API call to register user
      const response = await fetch("/api/auth/register-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          college: formData.college,
          program: formData.program,
          currentYear: formData.currentYear,
          studentId: formData.studentId,
          phone: formData.phone,
          academicInterests: formData.academicInterests,
          primaryGoal: formData.primaryGoal,
          timeline: formData.timeline,
          intensityLevel: formData.intensityLevel,
          collegeToken: collegeToken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      // Registration successful - redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  };

  const renderStep = () => {
    switch (currentStep as number) {
      case 1:
        return (
          <StepTransition isActive>
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-2xl relative group"
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <User className="w-8 h-8 text-[#10b981]" />
                  <div className="absolute inset-0 bg-[#10b981]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h2 className="text-4xl font-black mb-3 text-white tracking-tight">
                  Basic Information
                </h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Let's start with your basic details to build your personalized profile.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="college" className="text-white font-medium">
                    College/University *
                  </Label>
                  <Select
                    value={formData.college}
                    onValueChange={(value) => updateFormData({ college: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Select your college" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      {colleges.map((c) => (
                        <SelectItem
                          key={c}
                          value={c}
                          className="text-white hover:bg-white/10"
                        >
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentId" className="text-white font-medium">
                    Student ID *
                  </Label>
                  <Input
                    id="studentId"
                    placeholder="Your student ID"
                    value={formData.studentId}
                    onChange={(e) =>
                      updateFormData({ studentId: e.target.value })
                    }
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-indigo-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-white font-medium">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="Your first name"
                    value={formData.firstName}
                    onChange={(e) =>
                      updateFormData({ firstName: e.target.value })
                    }
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-indigo-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-white font-medium">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Your last name"
                    value={formData.lastName}
                    onChange={(e) =>
                      updateFormData({ lastName: e.target.value })
                    }
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-indigo-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@college.edu"
                    value={formData.email}
                    onChange={(e) =>
                      updateFormData({ email: e.target.value })
                    }
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-indigo-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) =>
                      updateFormData({ phone: e.target.value })
                    }
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-indigo-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="dateOfBirth"
                    className="text-white font-medium"
                  >
                    Date of Birth
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      updateFormData({ dateOfBirth: e.target.value })
                    }
                    className="bg-white/5 border-white/20 text-white focus:border-indigo-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white font-medium">
                    Gender (Optional)
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => updateFormData({ gender: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      <SelectItem
                        value="male"
                        className="text-white hover:bg-white/10"
                      >
                        Male
                      </SelectItem>
                      <SelectItem
                        value="female"
                        className="text-white hover:bg-white/10"
                      >
                        Female
                      </SelectItem>
                      <SelectItem
                        value="non-binary"
                        className="text-white hover:bg-white/10"
                      >
                        Non-binary
                      </SelectItem>
                      <SelectItem
                        value="prefer-not-to-say"
                        className="text-white hover:bg-white/10"
                      >
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white font-medium">
                    Password *
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) =>
                      updateFormData({ password: e.target.value })
                    }
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-indigo-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-white font-medium"
                  >
                    Confirm Password *
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      updateFormData({ confirmPassword: e.target.value })
                    }
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) =>
                    updateFormData({ agreeToTerms: checked as boolean })
                  }
                  className="border-white/20 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                />
                <Label htmlFor="terms" className="text-sm text-gray-300">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            </div>
          </StepTransition>
        );

      case 2:
        return (
          <StepTransition isActive>
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-2xl relative group"
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <GraduationCap className="w-8 h-8 text-[#10b981]" />
                  <div className="absolute inset-0 bg-[#10b981]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h2 className="text-4xl font-black mb-3 text-white tracking-tight">
                  Academic Information
                </h2>
                <p className="text-gray-400 max-w-md mx-auto">Tell us about your academic journey and achievements.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-white font-medium">Program/Course *</Label>
                  <Select
                    value={formData.program}
                    onValueChange={(value) => updateFormData({ program: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Select your program" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      {programs.map((program) => (
                        <SelectItem
                          key={program}
                          value={program}
                          className="text-white hover:bg-white/10"
                        >
                          {program}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white font-medium">Current Year *</Label>
                  <Select
                    value={formData.currentYear}
                    onValueChange={(value) => updateFormData({ currentYear: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      <SelectItem value="1" className="text-white hover:bg-white/10">
                        1st Year
                      </SelectItem>
                      <SelectItem value="2" className="text-white hover:bg-white/10">
                        2nd Year
                      </SelectItem>
                      <SelectItem value="3" className="text-white hover:bg-white/10">
                        3rd Year
                      </SelectItem>
                      <SelectItem value="4" className="text-white hover:bg-white/10">
                        4th Year
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white font-medium">Current Semester</Label>
                  <Select
                    value={formData.currentSemester}
                    onValueChange={(value) =>
                      updateFormData({ currentSemester: value })
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                        <SelectItem
                          key={sem}
                          value={String(sem)}
                          className="text-white hover:bg-white/10"
                        >
                          Semester {sem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white font-medium">Enrollment Year</Label>
                  <Select
                    value={formData.enrollmentYear}
                    onValueChange={(value) =>
                      updateFormData({ enrollmentYear: value })
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      {["2024", "2023", "2022", "2021"].map((year) => (
                        <SelectItem
                          key={year}
                          value={year}
                          className="text-white hover:bg-white/10"
                        >
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/20 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <Label className="text-white font-medium">Current GPA (Optional)</Label>
                    <div className="mt-4">
                      <Slider
                        value={formData.currentGPA}
                        onValueChange={(value) =>
                          updateFormData({ currentGPA: value })
                        }
                        max={10}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-400 mt-2">
                        <span>0.0</span>
                        <span className="font-medium text-indigo-400 text-lg">
                          {formData.currentGPA[0].toFixed(1)} CGPA
                        </span>
                        <span>10.0</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/20 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <Label className="text-white font-medium mb-4">
                      Academic Interests (Select multiple)
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                      {academicInterestOptions.map((interest) => {
                        const checked = formData.academicInterests.includes(interest);
                        return (
                          <label
                            key={interest}
                            htmlFor={interest}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition ${checked
                              ? "bg-indigo-500/10 border-indigo-400/40"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                              }`}
                          >
                            <Checkbox
                              id={interest}
                              checked={checked}
                              onCheckedChange={(isChecked) => {
                                if (isChecked) {
                                  updateFormData({
                                    academicInterests: [
                                      ...formData.academicInterests,
                                      interest,
                                    ],
                                  });
                                } else {
                                  updateFormData({
                                    academicInterests:
                                      formData.academicInterests.filter(
                                        (i) => i !== interest
                                      ),
                                  });
                                }
                              }}
                              className="border-white/30 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                            />
                            <span className="text-white/90 text-sm">{interest}</span>
                          </label>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </StepTransition>
        );

      case 3: {
        const currentQuestion = careerQuestions[currentQuestionIndex];
        const quizProgress =
          ((currentQuestionIndex + 1) / careerQuestions.length) * 100;

        return (
          <StepTransition isActive>
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-2xl relative group"
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <Target className="w-8 h-8 text-[#10b981]" />
                  <div className="absolute inset-0 bg-[#10b981]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h2 className="text-4xl font-black mb-3 text-white tracking-tight">
                  Career Interest Assessment
                </h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Help us understand your career preferences to suggest the best paths.
                </p>
              </div>

              <div className="text-center mb-2">
                <div className="text-sm text-gray-400 mb-2">
                  Question {currentQuestionIndex + 1} of {careerQuestions.length}
                </div>
                <Progress value={quizProgress} className="w-full" />
              </div>

              <Card className="bg-white/5 border-white/20">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-6 text-center text-white/90">
                    {currentQuestion.question}
                  </h3>
                  <RadioGroup
                    value={formData.careerQuizAnswers[currentQuestion.id] || ""}
                    onValueChange={(value) =>
                      updateFormData({
                        careerQuizAnswers: {
                          ...formData.careerQuizAnswers,
                          [currentQuestion.id]: value,
                        },
                      })
                    }
                    className="space-y-4"
                  >
                    {currentQuestion.options.map((option) => {
                      const selected =
                        formData.careerQuizAnswers[currentQuestion.id] ===
                        option.value;
                      return (
                        <label
                          key={option.value}
                          htmlFor={option.value}
                          className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition ${selected
                            ? "bg-emerald-500/10 border-emerald-400/40"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                            }`}
                        >
                          <RadioGroupItem value={option.value} id={option.value} />
                          <span className="text-2xl">{option.icon}</span>
                          <span className="text-white/90">{option.label}</span>
                        </label>
                      );
                    })}
                  </RadioGroup>

                  <div className="flex justify-between mt-6">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setCurrentQuestionIndex((idx) => Math.max(0, idx - 1))
                      }
                      disabled={currentQuestionIndex === 0}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      onClick={() => {
                        if (currentQuestionIndex < careerQuestions.length - 1) {
                          setCurrentQuestionIndex((idx) => idx + 1);
                        } else {
                          nextStep();
                        }
                      }}
                      disabled={!formData.careerQuizAnswers[currentQuestion.id]}
                      className="text-white font-bold px-8"
                      style={{
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        boxShadow: "0 8px 16px -8px rgba(16, 185, 129, 0.5)",
                      }}
                    >
                      {currentQuestionIndex === careerQuestions.length - 1
                        ? "Continue"
                        : "Next"}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </StepTransition>
        );
      }

      case 4:
        return (
          <StepTransition isActive>
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-2xl relative group"
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <Award className="w-8 h-8 text-[#10b981]" />
                  <div className="absolute inset-0 bg-[#10b981]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h2 className="text-4xl font-black mb-3 text-white tracking-tight">
                  Skills Assessment
                </h2>
                <p className="text-gray-400 max-w-md mx-auto">Rate your current skill levels to identify growth areas.</p>
              </div>

              <div className="space-y-6">
                <Card className="bg-white/5 border-white/20">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-white/90">
                      Technical Skills
                    </h3>
                    <div className="space-y-4">
                      {technicalSkillsList.map((skill) => (
                        <div key={skill} className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="text-white/90">{skill}</Label>
                            <span className="text-sm text-gray-400">
                              {(formData.technicalSkills && ((formData.technicalSkills as Record<string, number>)[skill])) ?? 0}/5
                            </span>
                          </div>
                          <Slider
                            value={[(formData.technicalSkills && ((formData.technicalSkills as Record<string, number>)[skill])) ?? 0]}
                            onValueChange={(value) =>
                              updateFormData({
                                technicalSkills: {
                                  ...formData.technicalSkills,
                                  [skill]: value[0],
                                },
                              })
                            }
                            max={5}
                            min={0}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/20">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-white/90">
                      Soft Skills
                    </h3>
                    <div className="space-y-4">
                      {softSkillsList.map((skill) => (
                        <div key={skill} className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="text-white/90">{skill}</Label>
                            <span className="text-sm text-gray-400">
                              {(formData.softSkills && ((formData.softSkills as Record<string, number>)[skill])) ?? 0}/5
                            </span>
                          </div>
                          <Slider
                            value={[(formData.softSkills && ((formData.softSkills as Record<string, number>)[skill])) ?? 0]}
                            onValueChange={(value) =>
                              updateFormData({
                                softSkills: {
                                  ...formData.softSkills,
                                  [skill]: value[0],
                                },
                              })
                            }
                            max={5}
                            min={0}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/20">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-white/90">
                      Language Skills
                    </h3>
                    <div className="space-y-4">
                      {languagesList.map((lang) => (
                        <div key={lang} className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="text-white/90">{lang}</Label>
                            <span className="text-sm text-gray-400">
                              {(formData.languageSkills && (formData.languageSkills as Record<string, number>)[lang]) ?? 0}/5
                            </span>
                          </div>
                          <Slider
                            value={[(formData.languageSkills && (formData.languageSkills as Record<string, number>)[lang]) ?? 0]}
                            onValueChange={(value) =>
                              updateFormData({
                                languageSkills: {
                                  ...formData.languageSkills,
                                  [lang]: value[0],
                                },
                              })
                            }
                            max={5}
                            min={0}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </StepTransition>
        );

      case 5:
        return (
          <StepTransition isActive>
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-2xl relative group"
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <MapPin className="w-8 h-8 text-[#10b981]" />
                  <div className="absolute inset-0 bg-[#10b981]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h2 className="text-4xl font-black mb-3 text-white tracking-tight">
                  Career Goals
                </h2>
                <p className="text-gray-400 max-w-md mx-auto">Define your career aspirations and where you want to go.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white/5 border-white/20">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-white/90">
                      Primary Career Goal
                    </h3>
                    <Select
                      value={formData.primaryGoal}
                      onValueChange={(value) =>
                        updateFormData({ primaryGoal: value })
                      }
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue placeholder="Select primary goal" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        <SelectItem value="software-engineer" className="text-white hover:bg-white/10">
                          Software Engineer
                        </SelectItem>
                        <SelectItem value="data-scientist" className="text-white hover:bg-white/10">
                          Data Scientist
                        </SelectItem>
                        <SelectItem value="product-manager" className="text-white hover:bg-white/10">
                          Product Manager
                        </SelectItem>
                        <SelectItem value="entrepreneur" className="text-white hover:bg-white/10">
                          Entrepreneur
                        </SelectItem>
                        <SelectItem value="researcher" className="text-white hover:bg-white/10">
                          Researcher
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="mt-6">
                      <h4 className="text-sm text-white/80 mb-2">
                        Secondary Goal (Optional)
                      </h4>
                      <Select
                        value={formData.secondaryGoal}
                        onValueChange={(value) =>
                          updateFormData({ secondaryGoal: value })
                        }
                      >
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <SelectValue placeholder="Select secondary goal" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/20">
                          <SelectItem value="full-stack" className="text-white hover:bg-white/10">
                            Full-Stack Developer
                          </SelectItem>
                          <SelectItem value="cloud-engineer" className="text-white hover:bg-white/10">
                            Cloud Engineer
                          </SelectItem>
                          <SelectItem value="ai-ml" className="text-white hover:bg-white/10">
                            AI/ML Engineer
                          </SelectItem>
                          <SelectItem value="cybersec" className="text-white hover:bg-white/10">
                            Cybersecurity
                          </SelectItem>
                          <SelectItem value="ui-ux" className="text-white hover:bg-white/10">
                            UI/UX
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/20">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-white/90">
                      Timeline
                    </h3>
                    <RadioGroup
                      value={formData.timeline}
                      onValueChange={(value) => updateFormData({ timeline: value })}
                      className="space-y-3"
                    >
                      <label htmlFor="2-years" className="flex items-center gap-3 p-3 rounded-lg border bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer">
                        <RadioGroupItem value="2-years" id="2-years" />
                        <span className="text-white/90">Within 2 years</span>
                      </label>
                      <label htmlFor="4-years" className="flex items-center gap-3 p-3 rounded-lg border bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer">
                        <RadioGroupItem value="4-years" id="4-years" />
                        <span className="text-white/90">Within 4 years</span>
                      </label>
                      <label htmlFor="after-graduation" className="flex items-center gap-3 p-3 rounded-lg border bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer">
                        <RadioGroupItem value="after-graduation" id="after-graduation" />
                        <span className="text-white/90">After graduation</span>
                      </label>
                    </RadioGroup>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/20">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-white/90">
                      Location Preference
                    </h3>
                    <Select
                      value={formData.locationPreference}
                      onValueChange={(value) =>
                        updateFormData({ locationPreference: value })
                      }
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        <SelectItem value="india" className="text-white hover:bg-white/10">
                          India
                        </SelectItem>
                        <SelectItem value="international" className="text-white hover:bg-white/10">
                          International
                        </SelectItem>
                        <SelectItem value="remote" className="text-white hover:bg-white/10">
                          Remote
                        </SelectItem>
                        <SelectItem value="flexible" className="text-white hover:bg-white/10">
                          Flexible
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/20">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-white/90">
                      Industry Focus
                    </h3>
                    <div className="space-y-3">
                      {(
                        [
                          "Technology",
                          "Finance",
                          "Healthcare",
                          "Education",
                          "Startup",
                        ] as readonly string[]
                      ).map((industry) => {
                        const checked = formData.industryFocus.includes(industry);
                        return (
                          <label
                            key={industry}
                            htmlFor={industry}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition ${checked
                              ? "bg-indigo-500/10 border-indigo-400/40"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                              }`}
                          >
                            <Checkbox
                              id={industry}
                              checked={checked}
                              onCheckedChange={(isChecked) => {
                                if (isChecked) {
                                  updateFormData({
                                    industryFocus: [
                                      ...formData.industryFocus,
                                      industry,
                                    ],
                                  });
                                } else {
                                  updateFormData({
                                    industryFocus: formData.industryFocus.filter(
                                      (i) => i !== industry
                                    ),
                                  });
                                }
                              }}
                              className="border-white/30 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                            />
                            <span className="text-white/90">{industry}</span>
                          </label>
                        );
                      }
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </StepTransition>
        );

      case 6:
        return (
          <StepTransition isActive>
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-2xl relative group"
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <Calendar className="w-8 h-8 text-[#10b981]" />
                  <div className="absolute inset-0 bg-[#10b981]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h2 className="text-4xl font-black mb-3 text-white tracking-tight">
                  Personalized Roadmap
                </h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Your customized learning path is ready to launch!
                </p>
              </div>

              <Card className="p-6 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/20">
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-black mb-3 text-white">
                    Congratulations{formData.firstName ? `, ${formData.firstName}` : ""}! 🎉
                  </h3>
                  <p className="text-gray-400 text-lg">
                    Based on your responses, we've created a personalized roadmap
                    for your journey to become a{" "}
                    <span className="text-blue-400 font-bold">
                      {formData.primaryGoal
                        ? formData.primaryGoal.replace("-", " ")
                        : "top professional"}
                    </span>
                    .
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10 group hover:border-[#10b981]/50 transition-colors">
                    <div className="text-3xl font-black text-emerald-400 mb-1">85%</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Goal Alignment</div>
                  </div>
                  <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10 group hover:border-[#10b981]/50 transition-colors">
                    <div className="text-3xl font-black text-emerald-300 mb-1">12</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Skills to Develop</div>
                  </div>
                  <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10 group hover:border-[#10b981]/50 transition-colors">
                    <div className="text-3xl font-black text-emerald-400 mb-1">24</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Months to Goal</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-white/90">
                    Your Learning Path Highlights:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      ["Foundation Building", "Core programming skills"],
                      ["Specialization", "Advanced technical skills"],
                      ["Project Experience", "Real-world applications"],
                      ["Career Preparation", "Interview & job readiness"],
                    ].map(([title, sub], i) => (
                      <div key={i} className="flex items-center gap-4 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg transform group-hover:scale-110 transition-transform">
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">{title}</div>
                          <div className="text-sm text-gray-500">{sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/5 border-white/20">
                <h4 className="font-semibold mb-4 text-white/90">
                  Customize Your Experience
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white/90">Learning Intensity</Label>
                    <RadioGroup
                      value={formData.intensityLevel}
                      onValueChange={(value) =>
                        updateFormData({ intensityLevel: value })
                      }
                      className="mt-3 space-y-3"
                    >
                      <label
                        htmlFor="light"
                        className="flex items-center gap-3 p-3 rounded-lg border bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer"
                      >
                        <RadioGroupItem value="light" id="light" />
                        <span className="text-white/90">Light (5–10 hrs/week)</span>
                      </label>
                      <label
                        htmlFor="moderate"
                        className="flex items-center gap-3 p-3 rounded-lg border bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer"
                      >
                        <RadioGroupItem value="moderate" id="moderate" />
                        <span className="text-white/90">Moderate (10–15 hrs/week)</span>
                      </label>
                      <label
                        htmlFor="intensive"
                        className="flex items-center gap-3 p-3 rounded-lg border bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer"
                      >
                        <RadioGroupItem value="intensive" id="intensive" />
                        <span className="text-white/90">Intensive (15+ hrs/week)</span>
                      </label>
                    </RadioGroup>
                  </div>
                </div>
              </Card>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Make Adjustments
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 h-14 rounded-xl text-white font-bold text-lg"
                  style={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    boxShadow: "0 8px 16px -8px rgba(16, 185, 129, 0.5)",
                  }}
                >
                  {isLoading ? "Creating Account..." : "Create My Account"}
                </Button>
              </div>
              {error && (
                <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
                  {error}
                </div>
              )}
            </div>
          </StepTransition>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <RocketProgress progress={progress} isCollege={true} />
      <div className="pt-4">
        {isLoading ? <RocketLaunchLoader /> : renderStep()}
      </div>

      {currentStep < totalSteps && !isLoading && (
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={nextStep}
            className="px-8 h-12 rounded-xl text-white font-bold"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              boxShadow: "0 8px 16px -8px rgba(16, 185, 129, 0.5)",
            }}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

// === College Registration Component ===
const CollegeRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    collegeName: "",
    email: "",
    phone: "",
    country: "",
    state: "",
    city: "",
    address: "",
    website: "",
    establishedYear: "",
    collegeType: "",
    accreditation: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    contactPerson: "",
    contactPersonEmail: "",
    contactPersonPhone: "",
    totalStudents: "",
    programs: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const countries = [
    "India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "China", "Singapore"
  ];

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
  ];

  const collegeTypes = [
    "Public University", "Private University", "Government College", "Private College",
    "Institute of Technology", "Medical College", "Engineering College", "Business School", "Arts College"
  ];

  const availablePrograms = [
    "Computer Science Engineering", "Information Technology", "Electronics Engineering",
    "Mechanical Engineering", "Civil Engineering", "Business Administration", "Economics",
    "Medicine", "Law", "Arts", "Science", "Commerce", "Pharmacy", "Architecture"
  ];

  const updateFormData = (updates: any) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep((s) => s + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Validate required fields
      if (!formData.collegeName || !formData.email || !formData.password) {
        throw new Error("Please fill in all required fields");
      }

      if (!formData.agreeToTerms) {
        throw new Error("Please agree to the terms and conditions");
      }

      // Generate a unique token for the college
      const collegeToken = generateCollegeToken();

      // Make API call to register college
      const response = await fetch("/api/auth/register-college", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          collegeToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Redirect to college login page
      router.push("/college-login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateCollegeToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 20; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepTransition isActive>
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-2xl relative group"
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Landmark className="w-8 h-8 text-[#10b981]" />
                  </motion.div>
                  <div className="absolute inset-0 bg-[#10b981]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h2 className="text-4xl font-black mb-3 text-white tracking-tight">
                  College Information
                </h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Tell us about your educational institution to get started.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="collegeName" className="text-white font-medium">
                    College/University Name *
                  </Label>
                  <Input
                    id="collegeName"
                    placeholder="Enter college name"
                    value={formData.collegeName}
                    onChange={(e) => updateFormData({ collegeName: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-green-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">
                    Official Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@college.edu"
                    value={formData.email}
                    onChange={(e) => updateFormData({ email: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-green-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white font-medium">
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => updateFormData({ phone: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-green-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white font-medium">Country *</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => updateFormData({ country: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      {countries.map((country) => (
                        <SelectItem
                          key={country}
                          value={country}
                          className="text-white hover:bg-white/10"
                        >
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.country === "India" && (
                  <div className="space-y-2">
                    <Label className="text-white font-medium">State *</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => updateFormData({ state: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        {indianStates.map((state) => (
                          <SelectItem
                            key={state}
                            value={state}
                            className="text-white hover:bg-white/10"
                          >
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-white font-medium">
                    City *
                  </Label>
                  <Input
                    id="city"
                    placeholder="Enter city"
                    value={formData.city}
                    onChange={(e) => updateFormData({ city: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-green-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-white font-medium">
                    Address
                  </Label>
                  <Input
                    id="address"
                    placeholder="Enter full address"
                    value={formData.address}
                    onChange={(e) => updateFormData({ address: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-green-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-white font-medium">
                    Website
                  </Label>
                  <Input
                    id="website"
                    placeholder="https://www.college.edu"
                    value={formData.website}
                    onChange={(e) => updateFormData({ website: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-green-400"
                  />
                </div>
              </div>
            </div>
          </StepTransition>
        );

      case 2:
        return (
          <StepTransition isActive>
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-2xl relative group"
                  style={{
                    background: "rgba(79,70,229,0.1)",
                    border: "1px solid rgba(79,70,229,0.25)",
                  }}
                >
                  <Award className="w-8 h-8 text-[#818cf8]" />
                  <div className="absolute inset-0 bg-[#818cf8]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h2 className="text-4xl font-black mb-3 text-white tracking-tight">
                  Institution Details
                </h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Additional information about your institution's profile.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-white font-medium">College Type *</Label>
                  <Select
                    value={formData.collegeType}
                    onValueChange={(value) => updateFormData({ collegeType: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Select college type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      {collegeTypes.map((type) => (
                        <SelectItem
                          key={type}
                          value={type}
                          className="text-white hover:bg-white/10"
                        >
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="establishedYear" className="text-white font-medium">
                    Established Year
                  </Label>
                  <Input
                    id="establishedYear"
                    placeholder="e.g., 1995"
                    value={formData.establishedYear}
                    onChange={(e) => updateFormData({ establishedYear: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-green-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accreditation" className="text-white font-medium">
                    Accreditation
                  </Label>
                  <Input
                    id="accreditation"
                    placeholder="e.g., NAAC, NBA, AICTE"
                    value={formData.accreditation}
                    onChange={(e) => updateFormData({ accreditation: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-green-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalStudents" className="text-white font-medium">
                    Total Students
                  </Label>
                  <Input
                    id="totalStudents"
                    placeholder="e.g., 5000"
                    value={formData.totalStudents}
                    onChange={(e) => updateFormData({ totalStudents: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-green-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson" className="text-white font-medium">
                    Contact Person Name
                  </Label>
                  <Input
                    id="contactPerson"
                    placeholder="Enter contact person name"
                    value={formData.contactPerson}
                    onChange={(e) => updateFormData({ contactPerson: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-green-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPersonEmail" className="text-white font-medium">
                    Contact Person Email
                  </Label>
                  <Input
                    id="contactPersonEmail"
                    type="email"
                    placeholder="contact@college.edu"
                    value={formData.contactPersonEmail}
                    onChange={(e) => updateFormData({ contactPersonEmail: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-green-400"
                  />
                </div>
              </div>

              <Card className="bg-white/5 border-white/20">
                <CardContent className="p-6">
                  <Label className="text-white font-medium mb-4">
                    Available Programs (Select multiple)
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                    {availablePrograms.map((program) => {
                      const checked = formData.programs.includes(program);
                      return (
                        <label
                          key={program}
                          htmlFor={program}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition ${checked
                            ? "bg-green-500/10 border-green-400/40"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                            }`}
                        >
                          <Checkbox
                            id={program}
                            checked={checked}
                            onCheckedChange={(isChecked) => {
                              if (isChecked) {
                                updateFormData({
                                  programs: [...formData.programs, program],
                                });
                              } else {
                                updateFormData({
                                  programs: formData.programs.filter((p) => p !== program),
                                });
                              }
                            }}
                            className="border-white/30 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                          />
                          <span className="text-white/90 text-sm">{program}</span>
                        </label>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </StepTransition>
        );

      case 3:
        return (
          <StepTransition isActive>
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-2xl relative group"
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <Shield className="w-8 h-8 text-[#10b981]" />
                  <div className="absolute inset-0 bg-[#10b981]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h2 className="text-4xl font-black mb-3 text-white tracking-tight">
                  Security & Access
                </h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Set up your account credentials for secure administration.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white font-medium">
                    Password *
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => updateFormData({ password: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-green-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white font-medium">
                    Confirm Password *
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-green-400"
                  />
                </div>
              </div>

              <Card className="p-6 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/20">
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-black mb-3 text-white">
                    Almost Ready! 🎉
                  </h3>
                  <p className="text-gray-400 text-lg">
                    After registration, you'll receive a unique token to share with your students
                    for easy registration and access to your college's platform.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-white/90">
                    What happens next:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      ["Token Generation", "Unique access token created"],
                      ["Student Access", "Share token with students"],
                      ["Dashboard Setup", "Access your admin panel"],
                      ["Student Management", "Manage student registrations"],
                    ].map(([title, sub], i) => (
                      <div key={i} className="flex items-center gap-4 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg transform group-hover:scale-110 transition-transform">
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{title}</div>
                          <div className="text-sm text-gray-500">{sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <Checkbox
                  id="terms-college"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) =>
                    updateFormData({ agreeToTerms: checked as boolean })
                  }
                  className="border-white/20 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
                <Label htmlFor="terms-college" className="text-sm text-gray-400">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-blue-400 hover:text-blue-300 font-bold underline"
                  >
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-blue-400 hover:text-blue-300 font-bold underline"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 h-14 rounded-xl text-white font-bold text-lg"
                  style={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    boxShadow: "0 8px 16px -8px rgba(16, 185, 129, 0.5)",
                  }}
                >
                  {isLoading ? "Creating Account..." : "Create College Account"}
                </Button>
              </div>
              {error && (
                <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
                  {error}
                </div>
              )}
            </div>
          </StepTransition>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <RocketProgress progress={progress} isCollege={true} />
      <div className="pt-4">
        {isLoading ? <RocketLaunchLoader /> : renderStep()}
      </div>

      {currentStep < totalSteps && !isLoading && (
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={nextStep}
            className="px-8 h-12 rounded-xl text-white font-bold"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              boxShadow: "0 8px 16px -8px rgba(16, 185, 129, 0.5)",
            }}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

// === Professional Registration Component ===
const ProfessionalRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    designation: "",
    industry: "",
    experience: "",
    currentSalary: "",
    expectedSalary: "",
    linkedin: "",
    github: "",
    portfolio: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    skills: [] as string[],
    certifications: "" as string,
    careerGoals: "" as string,
    preferredLearningStyle: "" as string,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>(""); // Add error state
  const router = useRouter();

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (updates: any) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep((s) => s + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        throw new Error("Please fill in all required fields");
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (!formData.agreeToTerms) {
        throw new Error("Please agree to the terms and conditions");
      }

      // Make API call to register professional
      const response = await fetch("/api/professionals/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          designation: formData.designation,
          industry: formData.industry,
          experience: formData.experience,
          currentSalary: formData.currentSalary,
          expectedSalary: formData.expectedSalary,
          linkedin: formData.linkedin,
          github: formData.github,
          portfolio: formData.portfolio,
          password: formData.password,
          skills: formData.skills,
          certifications: formData.certifications,
          careerGoals: formData.careerGoals,
          preferredLearningStyle: formData.preferredLearningStyle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Registration successful - redirect to professional login
      router.push("/professional-login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepTransition isActive>
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-2xl relative group"
                  style={{
                    background: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                  }}
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <User className="w-8 h-8 text-[#f59e0b]" />
                  </motion.div>
                  <div className="absolute inset-0 bg-[#f59e0b]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h2 className="text-4xl font-black mb-3 text-white tracking-tight">
                  Personal Information
                </h2>
                <p className="text-gray-400 max-w-md mx-auto">Let's start with your professional profile details.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-white font-medium">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="Your first name"
                    value={formData.firstName}
                    onChange={(e) => updateFormData({ firstName: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-white font-medium">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Your last name"
                    value={formData.lastName}
                    onChange={(e) => updateFormData({ lastName: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@company.com"
                    value={formData.email}
                    onChange={(e) => updateFormData({ email: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => updateFormData({ phone: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="text-white font-medium">
                    LinkedIn Profile
                  </Label>
                  <Input
                    id="linkedin"
                    placeholder="linkedin.com/in/yourprofile"
                    value={formData.linkedin}
                    onChange={(e) => updateFormData({ linkedin: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portfolio" className="text-white font-medium">
                    Portfolio Website
                  </Label>
                  <Input
                    id="portfolio"
                    placeholder="yourportfolio.com"
                    value={formData.portfolio}
                    onChange={(e) => updateFormData({ portfolio: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white font-medium">
                    Password *
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => updateFormData({ password: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white font-medium">
                    Confirm Password *
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>
          </StepTransition>
        );

      case 2:
        return (
          <StepTransition isActive>
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-2xl relative group"
                  style={{
                    background: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                  }}
                >
                  <Briefcase className="w-8 h-8 text-[#f59e0b]" />
                  <div className="absolute inset-0 bg-[#f59e0b]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h2 className="text-4xl font-black mb-3 text-white tracking-tight">
                  Professional Information
                </h2>
                <p className="text-gray-400 max-w-md mx-auto">Tell us about your career experience and skills.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-white font-medium">Current Company</Label>
                  <Select
                    value={formData.company}
                    onValueChange={(value) => updateFormData({ company: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Select your company" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      {companies.map((company) => (
                        <SelectItem key={company} value={company} className="text-white hover:bg-white/10">
                          {company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation" className="text-white font-medium">
                    Current Designation
                  </Label>
                  <Input
                    id="designation"
                    placeholder="e.g., Senior Software Engineer"
                    value={formData.designation}
                    onChange={(e) => updateFormData({ designation: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white font-medium">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => updateFormData({ industry: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry} className="text-white hover:bg-white/10">
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white font-medium">Years of Experience</Label>
                  <Select
                    value={formData.experience}
                    onValueChange={(value) => updateFormData({ experience: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      <SelectItem value="0-2" className="text-white hover:bg-white/10">0-2 years</SelectItem>
                      <SelectItem value="2-5" className="text-white hover:bg-white/10">2-5 years</SelectItem>
                      <SelectItem value="5-10" className="text-white hover:bg-white/10">5-10 years</SelectItem>
                      <SelectItem value="10-15" className="text-white hover:bg-white/10">10-15 years</SelectItem>
                      <SelectItem value="15+" className="text-white hover:bg-white/10">15+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentSalary" className="text-white font-medium">
                    Current CTC (Optional)
                  </Label>
                  <Input
                    id="currentSalary"
                    placeholder="e.g., 15 LPA"
                    value={formData.currentSalary}
                    onChange={(e) => updateFormData({ currentSalary: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedSalary" className="text-white font-medium">
                    Expected CTC (Optional)
                  </Label>
                  <Input
                    id="expectedSalary"
                    placeholder="e.g., 25 LPA"
                    value={formData.expectedSalary}
                    onChange={(e) => updateFormData({ expectedSalary: e.target.value })}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certifications" className="text-white font-medium">
                  Certifications (Optional)
                </Label>
                <Input
                  id="certifications"
                  placeholder="e.g., AWS Certified, PMP, Scrum Master"
                  value={formData.certifications}
                  onChange={(e) => updateFormData({ certifications: e.target.value })}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
            </div>
          </StepTransition>
        );

      case 3:
        return (
          <StepTransition isActive>
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-2xl relative group"
                  style={{
                    background: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                  }}
                >
                  <Target className="w-8 h-8 text-[#f59e0b]" />
                  <div className="absolute inset-0 bg-[#f59e0b]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h2 className="text-4xl font-black mb-3 text-white tracking-tight">
                  Career Goals & Preferences
                </h2>
                <p className="text-gray-400 max-w-md mx-auto">Help us understand your aspirations for tailored guidance.</p>
              </div>

              <Card className="bg-white/5 border-white/20">
                <CardContent className="p-6">
                  <Label className="text-white font-medium mb-4">Top Skills (Select multiple)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                    {academicInterestOptions.map((skill) => {
                      const checked = formData.skills.includes(skill);
                      return (
                        <label
                          key={skill}
                          htmlFor={skill}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer ${checked
                            ? "bg-amber-500/10 border-amber-400/40"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                            }`}
                        >
                          <Checkbox
                            id={skill}
                            checked={checked}
                            onCheckedChange={(isChecked) => {
                              if (isChecked) {
                                updateFormData({
                                  skills: [...formData.skills, skill],
                                });
                              } else {
                                updateFormData({
                                  skills: formData.skills.filter((s) => s !== skill),
                                });
                              }
                            }}
                            className="border-white/30"
                          />
                          <span className="text-white/90 text-sm">{skill}</span>
                        </label>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="careerGoals" className="text-white font-medium">
                  Career Goals (Brief Description)
                </Label>
                <textarea
                  id="careerGoals"
                  placeholder="Describe your short-term and long-term career goals..."
                  value={formData.careerGoals}
                  onChange={(e) => updateFormData({ careerGoals: e.target.value })}
                  className="w-full min-h-[100px] p-3 bg-white/5 border border-white/20 rounded-md text-white placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white font-medium">Preferred Learning Style</Label>
                <RadioGroup
                  value={formData.preferredLearningStyle}
                  onValueChange={(value) => updateFormData({ preferredLearningStyle: value })}
                  className="space-y-3"
                >
                  <label htmlFor="self-paced" className="flex items-center gap-3 p-3 rounded-lg border bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer">
                    <RadioGroupItem value="self-paced" id="self-paced" />
                    <span className="text-white/90">Self-paced online courses</span>
                  </label>
                  <label htmlFor="live-sessions" className="flex items-center gap-3 p-3 rounded-lg border bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer">
                    <RadioGroupItem value="live-sessions" id="live-sessions" />
                    <span className="text-white/90">Live instructor-led sessions</span>
                  </label>
                  <label htmlFor="hybrid" className="flex items-center gap-3 p-3 rounded-lg border bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer">
                    <RadioGroupItem value="hybrid" id="hybrid" />
                    <span className="text-white/90">Hybrid (mix of both)</span>
                  </label>
                  <label htmlFor="mentorship" className="flex items-center gap-3 p-3 rounded-lg border bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer">
                    <RadioGroupItem value="mentorship" id="mentorship" />
                    <span className="text-white/90">1-on-1 mentorship</span>
                  </label>
                </RadioGroup>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <Checkbox
                  id="terms-prof"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => updateFormData({ agreeToTerms: checked as boolean })}
                  className="border-white/20"
                />
                <Label htmlFor="terms-prof" className="text-sm text-gray-300">
                  I agree to the Terms and Conditions and Privacy Policy
                </Label>
              </div>

               <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full h-14 rounded-xl text-white font-bold text-lg"
                style={{
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  boxShadow: "0 8px 16px -8px rgba(245, 158, 11, 0.5)",
                }}
              >
                {isLoading ? "Creating Account..." : "Complete Registration"}
              </Button>

              {/* Error display */}
              {error && (
                <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
                  {error}
                </div>
              )}
            </div>
          </StepTransition>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <RocketProgress progress={progress} isCollege={false} />
      <div className="pt-4">
        {isLoading ? <RocketLaunchLoader /> : renderStep()}
      </div>

      {currentStep !== 3 && !isLoading && (
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={nextStep}
            className="px-8 h-12 rounded-xl text-white font-bold"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              boxShadow: "0 8px 16px -8px rgba(245, 158, 11, 0.5)",
            }}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

// === Main Register Component ===
export default function RegisterPage() {
  const [userType, setUserType] = useState<'professional' | 'college' | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 40 });

  // Check for any existing session - we need to check both roles to detect any logged in user
  const { isBlocked: isBlockedByProfessional, isLoading: isLoadingProfessional, activeRole: professionalActiveRole } = useSessionBlock('professional');
  const { isBlocked: isBlockedByCollege, isLoading: isLoadingCollege, activeRole: collegeActiveRole } = useSessionBlock('college');

  // Determine if still loading
  const isLoadingSession = isLoadingProfessional || isLoadingCollege;

  // Determine if blocked and by what role
  const activeRole = professionalActiveRole || collegeActiveRole || null;
  const isBlocked = activeRole !== null;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Show loading state while checking session
  if (isLoadingSession) {
    return (
      <div
        className="dark min-h-screen relative text-white flex items-center justify-center"
        style={{
          background:
            "radial-gradient(1200px 600px at 50% 0%, rgba(99,102,241,0.15), transparent 40%), radial-gradient(800px 400px at 100% 20%, rgba(168,85,247,0.12), transparent 40%), #0b0f1a",
        }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Block access if logged in as any role
  if (isBlocked && activeRole) {
    // Determine which block page to show based on what the user might be trying to access
    // Since they're on register-other, they might be trying to register as professional or college
    // We'll default to showing a professional block since that's likely the common case
    // We must pass a role that CONFLICTS with the active session to force the blocker to render.
    // If we pass the same role (e.g. professional), ActiveSessionBlock returns null (allowing access),
    // causing a blank screen because we returned valid JSX that rendered nothing.
    // Since this is a registration page, NO logged-in user should access it.
    const conflictingRole = activeRole === 'professional' ? 'student' : 'professional';
    return <ActiveSessionBlock intendedRole={conflictingRole} pageName="Registration" />;
  }

  if (!userType) {
    return (
      <div
        className="dark min-h-screen relative text-white"
        style={{
          background: "#030309",
        }}
      >
        <UserTypeSelection onSelect={setUserType} />
      </div>
    );
  }

  const isCollege = userType === 'college';

  return (
    <div
      className="dark min-h-screen relative text-white bg-[#030309]"
    >
      <AnimatedBackground />

      {/* Glow effects */}
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full opacity-10 blur-[120px] pointer-events-none"
        style={{ 
          background: isCollege 
            ? "radial-gradient(circle, #10b981 0%, transparent 70%)" 
            : "radial-gradient(circle, #f59e0b 0%, transparent 70%)" 
        }}
      />

      <div className="relative z-10 pt-20">
        {/* Header */}
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setUserType(null)}
                  className="text-gray-400 hover:text-white hover:bg-white/5 rounded-xl px-4 py-2 transition-all"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Change Path
                </Button>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`px-6 py-2 rounded-full text-sm font-bold tracking-wider uppercase border ${isCollege
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                {isCollege ? 'College' : 'Professional'} Registration
              </motion.div>
            </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-12">
          <Card className="border-white/10 bg-white/5 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-10">
              {isCollege ? <CollegeRegistration /> : <ProfessionalRegistration />}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 bg-black/20 mt-20">
          <div className="max-w-5xl mx-auto px-4 py-12 text-center">
            <p className="text-gray-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className={`font-bold underline-offset-4 hover:underline transition-all ${isCollege ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'}`}
              >
                Sign in here
              </Link>
            </p>
            <div className="mt-8 text-gray-600 text-xs">
              © {new Date().getFullYear()} StudentPath. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}