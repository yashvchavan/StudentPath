"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  GraduationCap,
  User,
  Briefcase,
  Star,
  Globe,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────
export interface ErpPrefillData {
  prn?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  branch?: string;
  department?: string;
  year?: string;
  semester?: string;
  division?: string;
  rollNo?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
}

interface CollegeDepartment {
  id: number;
  name: string;
  code: string;
}

interface StudentRegistrationProps {
  collegeToken: string | null;
  collegeInfo: any;
  prefillData?: ErpPrefillData;
}

// ── Locked Field (ERP sourced, read-only) ─────────────────────────────────
function LockedField({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <Label className="text-xs text-zinc-500 uppercase tracking-wider">{label}</Label>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-900 border border-zinc-700/50 rounded-lg">
        <Lock className="w-3 h-3 text-zinc-600 flex-shrink-0" />
        <span className="text-sm text-zinc-300 flex-1">{value}</span>
        <span className="text-[10px] text-emerald-500 font-medium">ERP</span>
      </div>
    </div>
  );
}

// ── Skill Selector ────────────────────────────────────────────────────────
function SkillSelector({
  label,
  skills,
  selected,
  onChange,
  maxLevel = 5,
}: {
  label: string;
  skills: string[];
  selected: Record<string, number>;
  onChange: (skills: Record<string, number>) => void;
  maxLevel?: number;
}) {
  const toggle = (skill: string) => {
    if (selected[skill] !== undefined) {
      const next = { ...selected };
      delete next[skill];
      onChange(next);
    } else {
      onChange({ ...selected, [skill]: 3 });
    }
  };

  const setLevel = (skill: string, level: number) => {
    onChange({ ...selected, [skill]: level });
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-zinc-200">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => {
          const isSelected = selected[skill] !== undefined;
          return (
            <button
              key={skill}
              type="button"
              onClick={() => toggle(skill)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border ${
                isSelected
                  ? "bg-blue-600/20 border-blue-500/60 text-blue-300"
                  : "bg-zinc-800/60 border-zinc-700/40 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              }`}
            >
              {skill}
            </button>
          );
        })}
      </div>
      {Object.keys(selected).length > 0 && (
        <div className="space-y-2 mt-2">
          <p className="text-xs text-zinc-500">Set proficiency level:</p>
          {Object.entries(selected).map(([skill, level]) => (
            <div key={skill} className="flex items-center gap-3">
              <span className="text-sm text-zinc-300 w-36 truncate">{skill}</span>
              <div className="flex gap-1">
                {Array.from({ length: maxLevel }, (_, i) => i + 1).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLevel(skill, l)}
                    className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                      l <= level
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <span className="text-xs text-zinc-500">/ {maxLevel}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Language Skill Selector ───────────────────────────────────────────────
function LanguageSelector({
  selected,
  onChange,
}: {
  selected: Record<string, string>;
  onChange: (val: Record<string, string>) => void;
}) {
  const LEVELS = ["Beginner", "Conversational", "Professional", "Native"];
  const LANGUAGES = ["English", "Hindi", "Marathi", "Tamil", "Telugu", "Bengali", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Spanish", "French", "German", "Other"];

  const toggle = (lang: string) => {
    if (selected[lang]) {
      const next = { ...selected };
      delete next[lang];
      onChange(next);
    } else {
      onChange({ ...selected, [lang]: "Conversational" });
    }
  };

  const setLevel = (lang: string, level: string) => {
    onChange({ ...selected, [lang]: level });
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-zinc-200">Languages</Label>
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => toggle(lang)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 ${
              selected[lang]
                ? "bg-purple-600/20 border-purple-500/60 text-purple-300"
                : "bg-zinc-800/60 border-zinc-700/40 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            }`}
          >
            {lang}
          </button>
        ))}
      </div>
      {Object.keys(selected).length > 0 && (
        <div className="space-y-2 mt-2">
          {Object.entries(selected).map(([lang, level]) => (
            <div key={lang} className="flex items-center gap-3">
              <span className="text-sm text-zinc-300 w-28 truncate">{lang}</span>
              <div className="flex gap-1 flex-wrap">
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLevel(lang, l)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      level === l
                        ? "bg-purple-600 text-white"
                        : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Registration Component ───────────────────────────────────────────
export const StudentRegistration: React.FC<StudentRegistrationProps> = ({
  collegeToken,
  collegeInfo,
  prefillData,
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = collegeToken || searchParams.get("token");

  const isErp = !!prefillData;

  // State
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState<CollegeDepartment[]>([]);

  // Form data — initialized with ERP values
  const [form, setForm] = useState({
    // Step 1: Account
    firstName:   prefillData?.firstName  || "",
    lastName:    prefillData?.lastName   || "",
    email:       prefillData?.email      || "",
    phone:       prefillData?.phone      || "",
    gender:      prefillData?.gender     || "",
    dateOfBirth: prefillData?.dateOfBirth || "",
    password:    "",
    confirmPassword: "",
    agreeToTerms: false,
    // ERP-only
    prn:      prefillData?.prn      || "",
    division: prefillData?.division || "",
    rollNo:   prefillData?.rollNo   || "",
    address:  prefillData?.address  || "",
    city:     prefillData?.city     || "",
    state:    prefillData?.state    || "",
    // Step 2: Academic
    department:   prefillData?.branch || prefillData?.department || "",
    currentYear:  prefillData?.year   || "",
    currentSemester: prefillData?.semester || "",
    enrollmentYear: "",
    currentGPA: "7.5",
    // Step 3: Interests
    academicInterests: [] as string[],
    // Step 4: Skills
    technicalSkills: {} as Record<string, number>,
    softSkills: {} as Record<string, number>,
    languageSkills: {} as Record<string, string>,
    // Step 5: Career
    primaryGoal: "",
    secondaryGoal: "",
    timeline: "",
    locationPreference: "",
    industryFocus: [] as string[],
    intensityLevel: "moderate",
  });

  // Re-sync if prefillData changes
  useEffect(() => {
    if (!prefillData) return;
    setForm((prev) => ({
      ...prev,
      firstName:   prefillData.firstName   || prev.firstName,
      lastName:    prefillData.lastName    || prev.lastName,
      email:       prefillData.email       || prev.email,
      phone:       prefillData.phone       || prev.phone,
      gender:      prefillData.gender      || prev.gender,
      dateOfBirth: prefillData.dateOfBirth || prev.dateOfBirth,
      prn:         prefillData.prn         || prev.prn,
      division:    prefillData.division    || prev.division,
      rollNo:      prefillData.rollNo      || prev.rollNo,
      address:     prefillData.address     || prev.address,
      city:        prefillData.city        || prev.city,
      state:       prefillData.state       || prev.state,
      department:  prefillData.branch || prefillData.department || prev.department,
      currentYear: prefillData.year        || prev.currentYear,
      currentSemester: prefillData.semester || prev.currentSemester,
    }));
  }, [prefillData]);

  // Load college departments for manual users
  useEffect(() => {
    if (!token || isErp) return;
    fetch(`/api/college/departments?token=${token}`)
      .then((r) => r.json())
      .then((d) => { if (d.departments) setDepartments(d.departments); })
      .catch(() => {});
  }, [token, isErp]);

  const up = (patch: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patch }));

  const locked = (field: keyof ErpPrefillData): boolean => {
    if (!isErp) return false;
    const value = (prefillData as any)?.[field];
    return !!value;
  };

  const TOTAL_STEPS = 5;

  // Interest options (from ERPs department → common topics)
  const INTEREST_MAP: Record<string, string[]> = {
    "Computer Engineering":         ["Algorithms", "System Design", "Operating Systems", "Networking", "Databases", "Compilers", "Embedded Systems", "AI/ML", "Cybersecurity", "Web Development"],
    "Computer Science Engineering": ["AI/ML", "Data Science", "Web Development", "Mobile Development", "Cybersecurity", "Cloud Computing", "DevOps", "Blockchain", "Computer Vision", "NLP"],
    "Information Technology":       ["Web Development", "Mobile Development", "Network Admin", "Cybersecurity", "Cloud Computing", "DevOps", "IT Project Management", "Data Analytics", "UI/UX Design"],
    "Electronics Engineering":      ["Embedded Systems", "IoT", "Signal Processing", "VLSI Design", "Robotics", "Telecommunications", "Control Systems", "Circuit Design", "RF Engineering"],
    "Electronics & Telecommunication": ["Signal Processing", "Telecommunications", "RF Engineering", "Microwave Engineering", "Antenna Design", "Embedded Systems", "IoT"],
    "Mechanical Engineering":        ["CAD/CAM", "Manufacturing", "Automotive", "Robotics", "Thermal Engg", "Materials Science", "Fluid Mechanics", "Renewable Energy"],
    "Civil Engineering":             ["Structural Engg", "Construction Management", "Urban Planning", "Environmental Engg", "Transportation", "Water Resources", "Geotechnical Engg"],
    "Electrical Engineering":        ["Power Systems", "Renewable Energy", "Power Electronics", "Drives & Control", "Smart Grid", "Electric Vehicles", "Instrumentation"],
    "Business Administration":       ["Marketing", "Finance & Accounting", "HR Management", "Supply Chain", "Business Analytics", "Entrepreneurship", "International Business"],
    "Economics":                     ["Macroeconomics", "Microeconomics", "Econometrics", "Finance", "Development Economics", "Public Policy"],
  };

  const getInterests = (): string[] => {
    if (!form.department) return [];
    // Try exact match first
    for (const key of Object.keys(INTEREST_MAP)) {
      if (form.department.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(form.department.toLowerCase())) {
        return INTEREST_MAP[key];
      }
    }
    return ["Software Development", "Data Analysis", "Research", "Project Management", "Machine Learning", "Cloud Computing"];
  };

  const TECH_SKILLS_MAP: Record<string, string[]> = {
    "Web Development":    ["HTML/CSS", "JavaScript", "React", "Node.js", "TypeScript", "Next.js"],
    "AI/ML":              ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy"],
    "Data Science":       ["Python", "SQL", "Tableau", "Power BI", "R", "Excel"],
    "Mobile Development": ["React Native", "Flutter", "Swift", "Kotlin", "Android", "iOS"],
    "Cloud Computing":    ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform"],
    "Cybersecurity":      ["Linux", "Kali Linux", "Wireshark", "Python", "Network Security", "Penetration Testing"],
    "Embedded Systems":   ["C/C++", "Arduino", "Raspberry Pi", "RTOS", "Verilog", "MATLAB"],
    "Databases":          ["SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Oracle"],
    "DevOps":             ["Docker", "Kubernetes", "Jenkins", "Git", "Ansible", "CI/CD"],
    "Algorithms":         ["C++", "Java", "Python", "Data Structures", "Dynamic Programming", "Graph Algorithms"],
  };

  const getTechSkills = (): string[] => {
    const set = new Set<string>();
    form.academicInterests.forEach((interest) => {
      (TECH_SKILLS_MAP[interest] || []).forEach((s) => set.add(s));
    });
    if (set.size === 0) ["Python", "JavaScript", "SQL", "Git", "Linux", "Java"].forEach(s => set.add(s));
    return Array.from(set).slice(0, 20);
  };

  const SOFT_SKILLS = ["Communication", "Leadership", "Teamwork", "Problem Solving", "Time Management", "Adaptability", "Critical Thinking", "Creativity", "Public Speaking", "Project Management"];
  const CAREER_GOALS = ["Software Developer", "Data Scientist", "AI/ML Engineer", "Product Manager", "DevOps Engineer", "Cybersecurity Analyst", "Cloud Architect", "Business Analyst", "Research Scientist", "Entrepreneur"];
  const INDUSTRY_LIST = ["Technology", "Finance/FinTech", "Healthcare", "Education/EdTech", "E-Commerce", "Automotive", "Manufacturing", "Government/PSU", "Consulting", "Startup"];
  const TIMELINE_OPTIONS = ["Internship (6 months)", "1 Year", "2 Years", "Long-term (4+ years)"];
  const LOCATION_OPTIONS = ["Anywhere in India", "Home City/State", "Metro Cities", "Remote/WFH", "Open to Abroad"];
  const YEAR_OPTIONS = ["1", "2", "3", "4"];
  const SEM_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8"];

  // ── Step 1: Register Account ──────────────────────────────────────────
  const handleRegister = async () => {
    setError("");
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      return setError("Please fill in all required fields.");
    }
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    if (!form.agreeToTerms) return setError("Please agree to the terms.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-basic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId:    form.prn,
          firstName:    form.firstName,
          lastName:     form.lastName,
          email:        form.email,
          phone:        form.phone,
          dateOfBirth:  form.dateOfBirth,
          gender:       form.gender,
          password:     form.password,
          collegeToken: token,
          division:     form.division,
          rollNo:       form.rollNo,
          address:      form.address,
          city:         form.city,
          state:        form.state,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setUserId(data.userId);
      setIsRegistered(true);
      setStep(2);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2-5: Complete Profile ─────────────────────────────────────────
  const handleCompleteProfile = async () => {
    if (!userId) return setError("Session error — please refresh.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id:        userId,
          collegeToken:      token,
          program:           form.department,
          currentYear:       form.currentYear,
          currentSemester:   form.currentSemester,
          enrollmentYear:    form.enrollmentYear,
          currentGPA:        parseFloat(form.currentGPA) || null,
          academicInterests: form.academicInterests,
          careerQuizAnswers: {},
          technicalSkills:   form.technicalSkills,
          softSkills:        form.softSkills,
          languageSkills:    form.languageSkills,
          primaryGoal:       form.primaryGoal,
          secondaryGoal:     form.secondaryGoal,
          timeline:          form.timeline,
          locationPreference: form.locationPreference,
          industryFocus:     form.industryFocus,
          intensityLevel:    form.intensityLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Profile completion failed");
      // Redirect to login
      window.location.href = `/login?token=${token}`;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setError("");
    if (step === 1) { handleRegister(); return; }
    if (step === TOTAL_STEPS) { handleCompleteProfile(); return; }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  };

  const stepLabels = ["Account", "Academic", "Interests", "Skills", "Career"];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {stepLabels.map((label, i) => {
            const num = i + 1;
            const done = step > num;
            const active = step === num;
            return (
              <div key={label} className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  done   ? "bg-emerald-600 text-white" :
                  active ? "bg-blue-600 text-white" :
                           "bg-zinc-800 text-zinc-500"
                }`}>
                  {done ? <CheckCircle className="w-4 h-4" /> : num}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${active ? "text-white" : "text-zinc-600"}`}>{label}</span>
              </div>
            );
          })}
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} className="h-1 bg-zinc-800" />
      </div>

      {/* Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8">
        {/* Step heading */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            {[GraduationCap, User, Star, Briefcase, Globe][step - 1] &&
              React.createElement([GraduationCap, User, Star, Briefcase, Globe][step - 1], { className: "w-5 h-5 text-blue-400" })}
            <h3 className="text-xl font-bold text-white">
              {["Create Your Account", "Academic Info", "Academic Interests", "Your Skills", "Career Goals"][step - 1]}
            </h3>
          </div>
          <p className="text-sm text-zinc-500">
            {["Set up login credentials. ERP fields are pre-filled and locked.",
              "Your program and year info.",
              "Select what topics interest you.",
              "Your technical, soft, and language skills.",
              "Where you want to go in your career."][step - 1]}
          </p>
          {isErp && step === 1 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/5 border border-emerald-400/20 rounded-lg px-3 py-2">
              <CheckCircle className="w-3.5 h-3.5" />
              ERP-verified — your institution data is pre-filled
            </div>
          )}
        </div>

        {/* ── STEP 1: Account ───────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {locked("firstName") ? (
                <LockedField label="First Name" value={form.firstName} />
              ) : (
                <Field label="First Name *" value={form.firstName} onChange={v => up({ firstName: v })} placeholder="First name" />
              )}
              {locked("lastName") ? (
                <LockedField label="Last Name" value={form.lastName} />
              ) : (
                <Field label="Last Name *" value={form.lastName} onChange={v => up({ lastName: v })} placeholder="Last name" />
              )}
            </div>

            {locked("email") ? (
              <LockedField label="Email Address" value={form.email} />
            ) : (
              <Field label="Email *" value={form.email} onChange={v => up({ email: v })} type="email" placeholder="your@email.com" />
            )}

            <div className="grid grid-cols-2 gap-4">
              {locked("phone") ? (
                <LockedField label="Phone" value={form.phone} />
              ) : (
                <Field label="Phone" value={form.phone} onChange={v => up({ phone: v })} placeholder="+91 XXXXX XXXXX" />
              )}
              {locked("gender") ? (
                <LockedField label="Gender" value={form.gender} />
              ) : (
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">Gender</Label>
                  <select
                    value={form.gender}
                    onChange={e => up({ gender: e.target.value })}
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              )}
            </div>

            {locked("dateOfBirth") ? (
              <LockedField label="Date of Birth" value={form.dateOfBirth} />
            ) : (
              <Field label="Date of Birth" value={form.dateOfBirth} onChange={v => up({ dateOfBirth: v })} type="date" />
            )}

            {/* Show ERP-locked supplementary fields */}
            {isErp && (form.prn || form.division || form.rollNo) && (
              <div className="grid grid-cols-3 gap-3">
                {form.prn      && <LockedField label="PRN"      value={form.prn} />}
                {form.division && <LockedField label="Division" value={form.division} />}
                {form.rollNo   && <LockedField label="Roll No"  value={form.rollNo} />}
              </div>
            )}
            {isErp && (form.city || form.state) && (
              <div className="grid grid-cols-2 gap-3">
                {form.city  && <LockedField label="City"  value={form.city} />}
                {form.state && <LockedField label="State" value={form.state} />}
              </div>
            )}

            <div className="pt-2 border-t border-zinc-800 space-y-4">
              <Field label="Password *" value={form.password} onChange={v => up({ password: v })} type="password" placeholder="Minimum 8 characters" />
              <Field label="Confirm Password *" value={form.confirmPassword} onChange={v => up({ confirmPassword: v })} type="password" placeholder="Re-enter password" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={form.agreeToTerms}
                onChange={e => up({ agreeToTerms: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-600 accent-blue-600"
              />
              <span className="text-sm text-zinc-400">
                I agree to the <span className="text-blue-400 underline cursor-pointer">Terms of Service</span> and <span className="text-blue-400 underline cursor-pointer">Privacy Policy</span>
              </span>
            </label>
          </div>
        )}

        {/* ── STEP 2: Academic Info ─────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            {isErp && form.department ? (
              <LockedField label="Department / Branch" value={form.department} />
            ) : (
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Department / Branch *</Label>
                {departments.length > 0 ? (
                  <select
                    value={form.department}
                    onChange={e => up({ department: e.target.value })}
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                ) : (
                  <Field label="" value={form.department} onChange={v => up({ department: v })} placeholder="e.g. Computer Engineering" />
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {isErp && form.currentYear ? (
                <LockedField label="Current Year" value={`Year ${form.currentYear}`} />
              ) : (
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">Current Year *</Label>
                  <select
                    value={form.currentYear}
                    onChange={e => up({ currentYear: e.target.value })}
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select year</option>
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              )}

              {isErp && form.currentSemester ? (
                <LockedField label="Current Semester" value={`Sem ${form.currentSemester}`} />
              ) : (
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">Current Semester *</Label>
                  <select
                    value={form.currentSemester}
                    onChange={e => up({ currentSemester: e.target.value })}
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select semester</option>
                    {SEM_OPTIONS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Enrollment Year</Label>
                <select
                  value={form.enrollmentYear}
                  onChange={e => up({ enrollmentYear: e.target.value })}
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select year</option>
                  {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Current GPA / CGPA</Label>
                <input
                  type="number" step="0.1" min="0" max="10"
                  value={form.currentGPA}
                  onChange={e => up({ currentGPA: e.target.value })}
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. 8.2"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Academic Interests ────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">Select topics that interest you in your field. These help personalize your learning and career recommendations.</p>
            {getInterests().length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {getInterests().map((interest) => {
                  const selected = form.academicInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => {
                        up({
                          academicInterests: selected
                            ? form.academicInterests.filter(i => i !== interest)
                            : [...form.academicInterests, interest],
                        });
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ${
                        selected
                          ? "bg-blue-600/20 border-blue-500/60 text-blue-300"
                          : "bg-zinc-800/60 border-zinc-700/40 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-600">Select your department first (Step 2) to see relevant interest options.</p>
            )}
            {form.academicInterests.length > 0 && (
              <p className="text-xs text-zinc-600">{form.academicInterests.length} selected</p>
            )}
          </div>
        )}

        {/* ── STEP 4: Skills ────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-8">
            <SkillSelector
              label="Technical Skills"
              skills={getTechSkills()}
              selected={form.technicalSkills}
              onChange={v => up({ technicalSkills: v })}
            />
            <div className="border-t border-zinc-800 pt-6">
              <SkillSelector
                label="Soft Skills"
                skills={SOFT_SKILLS}
                selected={form.softSkills}
                onChange={v => up({ softSkills: v })}
              />
            </div>
            <div className="border-t border-zinc-800 pt-6">
              <LanguageSelector
                selected={form.languageSkills}
                onChange={v => up({ languageSkills: v })}
              />
            </div>
          </div>
        )}

        {/* ── STEP 5: Career Goals ──────────────────────── */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400 uppercase tracking-wider">Primary Career Goal</Label>
              <div className="flex flex-wrap gap-2">
                {CAREER_GOALS.map(goal => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => up({ primaryGoal: goal })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      form.primaryGoal === goal
                        ? "bg-blue-600/20 border-blue-500/60 text-blue-300"
                        : "bg-zinc-800/60 border-zinc-700/40 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-zinc-400 uppercase tracking-wider">Secondary Goal (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {CAREER_GOALS.filter(g => g !== form.primaryGoal).map(goal => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => up({ secondaryGoal: form.secondaryGoal === goal ? "" : goal })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      form.secondaryGoal === goal
                        ? "bg-purple-600/20 border-purple-500/60 text-purple-300"
                        : "bg-zinc-800/60 border-zinc-700/40 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Timeline</Label>
                <select
                  value={form.timeline}
                  onChange={e => up({ timeline: e.target.value })}
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  {TIMELINE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Location Preference</Label>
                <select
                  value={form.locationPreference}
                  onChange={e => up({ locationPreference: e.target.value })}
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  {LOCATION_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-zinc-400 uppercase tracking-wider">Industry Focus</Label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRY_LIST.map(ind => {
                  const selected = form.industryFocus.includes(ind);
                  return (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => {
                        up({
                          industryFocus: selected
                            ? form.industryFocus.filter(i => i !== ind)
                            : [...form.industryFocus, ind],
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        selected
                          ? "bg-emerald-600/20 border-emerald-500/60 text-emerald-300"
                          : "bg-zinc-800/60 border-zinc-700/40 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                      }`}
                    >
                      {ind}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Learning Intensity</Label>
              <div className="flex gap-3">
                {["light", "moderate", "intensive"].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => up({ intensityLevel: level })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border capitalize transition-all ${
                      form.intensityLevel === level
                        ? "bg-blue-600/20 border-blue-500/60 text-blue-300"
                        : "bg-zinc-800/60 border-zinc-700/40 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-800">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1 || loading}
            className="text-zinc-400 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          <div className="flex items-center gap-3">
            {step < TOTAL_STEPS && step > 1 && (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Skip this step →
              </button>
            )}
            <Button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white min-w-[120px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {step === 1 ? "Registering..." : step === TOTAL_STEPS ? "Saving..." : "Next"}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  {step === TOTAL_STEPS ? "Complete Registration" : step === 1 ? "Create Account" : "Continue"}
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Simple field helper ───────────────────────────────────────────────────
function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      {label && <Label className="text-xs text-zinc-400">{label}</Label>}
      <Input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 h-10"
      />
    </div>
  );
}

export default StudentRegistration;
