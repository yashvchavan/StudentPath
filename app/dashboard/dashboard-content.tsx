"use client";

import DashboardLayout from "@/components/dashboard-layout";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, GraduationCap, Code, Users, Languages, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface StudentData {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  college: string;
  college_name: string;
  college_type: string;
  program: string;
  current_year: number;
  current_semester: string;
  current_gpa: number;
  academic_interests: string[];
  career_quiz_answers: Record<string, string>;
  technical_skills: Record<string, number>;
  soft_skills: Record<string, number>;
  language_skills: Record<string, string>;
  primary_goal: string;
  secondary_goal: string;
  timeline: string;
  location_preference: string;
  industry_focus: string[];
  city: string;
  state: string;
  country: string;
}

export default function DashboardContent() {
  /* 
     REFACTOR NOTE:
     We are now using the secure `useAuth` hook and `auth_session` cookie. 
     Legacy `studentData` cookie reading is removed.
  */
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!isAuthenticated || !user) return;

      try {
        // Fetch detailed student data from API
        // Since we are authenticated with auth_session, we don't need to pass token in query param if API supports it.
        // We'll pass studentId just in case, or use `user.id`

        const apiResponse = await fetch(
          `/api/student/data?studentId=${user.id}`,
          {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }
        );

        // Note: If /api/student/data requires a 'token' query param for College token validation,
        // we might need to adjust it. However, in our previous refactor of /api/student/data,
        // we made it accept 'auth_session' cookie as a valid authenticator.

        if (!apiResponse.ok) {
          // If 400/401, it might be due to missing 'token' param if the API specifically demands it for non-cookie flows?
          // Let's check the API code again...
          // /api/student/data checks for 'token' param OR 'auth_session' cookie logic.
          // It accepts 'auth_session' cookie.

          // However, if it fails, we fall back to safe defaults or error?
          const errorData = await apiResponse.json().catch(() => ({}));
          console.warn("API Error:", errorData);
          // Dont throw, try to continue with basic user data?
        }

        const apiData = await apiResponse.json().catch(() => ({}));

        if (apiData.success && apiData.data) {
          // Add safe defaults for empty fields
          const safeData = {
            ...apiData.data,
            first_name: apiData.data.first_name || user.name.split(' ')[0] || 'Student',
            last_name: apiData.data.last_name || user.name.split(' ').slice(1).join(' ') || '',
            technical_skills: apiData.data.technical_skills || {},
            soft_skills: apiData.data.soft_skills || {},
            language_skills: apiData.data.language_skills || {},
            academic_interests: apiData.data.academic_interests || [],
            industry_focus: apiData.data.industry_focus || [],
            career_quiz_answers: apiData.data.career_quiz_answers || {}
          };

          setStudentData(safeData);
          console.log("Fetched student data:", safeData);
        } else {
          // Fallback to minimal data from user object if API fails
          setStudentData({
            student_id: String(user.id),
            first_name: user.name.split(' ')[0],
            last_name: user.name.split(' ').slice(1).join(' '),
            email: user.email,
            college: '',
            college_name: 'Your College',
            current_year: 1,
            current_semester: 'Sem 1',
            // defaults for rest
            college_type: 'Unknown',
            program: 'General',
            current_gpa: 0,
            academic_interests: [],
            career_quiz_answers: {},
            technical_skills: {},
            soft_skills: {},
            language_skills: {},
            primary_goal: 'Learn',
            secondary_goal: 'Explore',
            timeline: 'Flexible',
            location_preference: 'Any',
            industry_focus: [],
            city: '',
            state: '',
            country: '',
            phone: ''
          } as StudentData);
        }

      } catch (error) {
        console.error('Error fetching student details:', error);
      } finally {
        setDataLoading(false);
      }
    };

    if (!authLoading) {
      if (isAuthenticated && user) {
        fetchStudentData();
      } else {
        setDataLoading(false);
      }
    }
  }, [isAuthenticated, user, authLoading]);

  // Unified loading state
  const isLoading = authLoading || dataLoading;

  if (isLoading) {
    return (
      <DashboardLayout currentPage="dashboard">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    window.location.href = '/login';
    return null;
  }

  // Fallback if data loading failed but we are authenticated (should rarely happen due to fallback above)
  if (!studentData) {
    return (
      <DashboardLayout currentPage="dashboard">
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading student data...</p>
        </div>
      </DashboardLayout>
    )
  }


  return (
    <DashboardLayout
      currentPage="dashboard"
    >
      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome, {studentData.first_name} {studentData.last_name}!
          </h1>
          <div className="flex items-center text-muted-foreground">
            <Building className="w-4 h-4 mr-2" />
            <span>{studentData.college_name} • </span>
            <MapPin className="w-4 h-4 mx-2" />
            <span>{`${studentData.city}, ${studentData.state}, ${studentData.country}`}</span>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Academic Progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Academic Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${(studentData.current_year / 4) * 100}, 100`}
                      className="text-primary"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-muted"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-foreground">{Math.round((studentData.current_year / 4) * 100)}%</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Year {studentData.current_year} - {studentData.current_semester}
              </p>
              <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
                View detailed progress
              </Button>
            </CardContent>
          </Card>

          {/* GPA Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">GPA Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground mb-2">{Number(studentData.current_gpa).toFixed(2)}</div>
                <div className="w-full bg-muted rounded-full h-2 mb-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${(Number(studentData.current_gpa) / 10) * 100}%` }}
                  />
                </div>
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  Update grades
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Career Goal */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Career Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground mb-2">{studentData.primary_goal}</div>
                <div className="text-sm text-muted-foreground mb-4">{studentData.timeline}</div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Star className="w-4 h-4 text-secondary" />
                  <span className="text-sm text-muted-foreground">Goal aligned</span>
                </div>
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  View career path
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Skills Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Skills Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Technical Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {studentData?.technical_skills && Object.keys(studentData.technical_skills).length > 0 ? (
                      Object.entries(studentData.technical_skills)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 3)
                        .map(([skill, level]) => (
                          <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {skill}
                          </span>
                        ))
                    ) : (
                      <p className="text-sm text-gray-500">No skills added yet</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Soft Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {studentData?.soft_skills && Object.keys(studentData.soft_skills).length > 0 ? (
                      Object.entries(studentData.soft_skills)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 3)
                        .map(([skill, level]) => (
                          <Badge key={skill} variant="outline">
                            {skill} - L{level}
                          </Badge>
                        ))
                    ) : (
                      <p className="text-sm text-gray-500">No soft skills added yet</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Academic Profile */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Academic Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Program</p>
                  <p className="font-medium">{studentData.program}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">College Type</p>
                  <p className="font-medium">{studentData.college_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Academic Interests</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {studentData?.academic_interests && studentData.academic_interests.length > 0 ? (
                      studentData.academic_interests.map((interest) => (
                        <Badge key={interest} variant="secondary">
                          {interest}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No academic interests added yet</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Skills */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Technical Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentData?.technical_skills && Object.keys(studentData.technical_skills).length > 0 ? (
                  Object.entries(studentData.technical_skills)
                    .sort(([, a], [, b]) => b - a)
                    .map(([skill, level]) => (
                      <div key={skill} className="flex items-center justify-between">
                        <span className="text-sm">{skill}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={level * 20} className="w-20" />
                          <span className="text-xs text-muted-foreground">{level}/5</span>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-gray-500">No technical skills added yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Industry Focus */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Industry Focus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Industries of Interest</p>
                  <div className="flex flex-wrap gap-2">
                    {studentData?.industry_focus && studentData.industry_focus.length > 0 ? (
                      studentData.industry_focus.map((industry) => (
                        <Badge key={industry} variant="secondary">
                          {industry}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No industry focus added yet</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location Preference</p>
                  <p className="font-medium mt-1">{studentData.location_preference}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Timeline</p>
                  <p className="font-medium mt-1">{studentData.timeline}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Soft Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Soft Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentData?.career_quiz_answers && Object.keys(studentData.career_quiz_answers).length > 0 ? (
                  Object.entries(studentData.soft_skills)
                    .sort(([, a], [, b]) => b - a)
                    .map(([skill, level]) => (
                      <div key={skill} className="flex items-center justify-between">
                        <span className="text-sm">{skill}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={level * 20} className="w-20" />
                          <span className="text-xs text-muted-foreground">{level}/5</span>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-gray-500">No quiz answers yet</p>
                )}

              </div>
            </CardContent>
          </Card>

          {/* Language Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5" />
                Language Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentData?.language_skills && Object.keys(studentData.language_skills).length > 0 ? (
                  Object.entries(studentData.language_skills).map(([language, proficiency]) => (
                    <div key={language} className="flex items-center justify-between">
                      <span className="text-sm">{language}</span>
                      <Badge variant="outline">{proficiency}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No language skills added yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  );
}
