"use client";

import DashboardLayout from "@/components/dashboard-layout";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, GraduationCap, Code, Users, Languages, Star } from "lucide-react";

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
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
  const fetchStudentData = async () => {
    try {
      // Get data from cookie
      const cookie = document.cookie
        .split("; ")
        .find(row => row.startsWith("studentData="));
      
      if (!cookie) {
        throw new Error("No student data found");
      }

      const studentDataFromCookie = JSON.parse(decodeURIComponent(cookie.split("=")[1]));
      
      // Fetch detailed student data from API
      const apiResponse = await fetch(
        `/api/student/data?studentId=${studentDataFromCookie.student_id}&token=${encodeURIComponent(studentDataFromCookie.token)}`,
        {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || "Failed to fetch student data");
      }

      const apiData = await apiResponse.json();
      
      // FIX: Set studentData to apiData.data, not apiData
      if (apiData.success && apiData.data) {
        // Add safe defaults for empty fields
        const safeData = {
          ...apiData.data,
          first_name: apiData.data.first_name || 'Student',
          last_name: apiData.data.last_name || '',
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
        throw new Error("Invalid API response");
      }

      // Verify authentication
      if (!studentDataFromCookie.isAuthenticated || !studentDataFromCookie.timestamp) {
        throw new Error("Invalid authentication data");
      }

      // Check if cookie is not too old (24 hours)
      const cookieAge = Date.now() - studentDataFromCookie.timestamp;
      if (cookieAge > 24 * 60 * 60 * 1000) {
        throw new Error("Authentication expired");
      }

    } catch (error) {
      console.error('Error:', error);
      // Optionally redirect to login on error
      // window.location.replace('/login');
    } finally {
      setIsLoading(false);
    }
  };

  fetchStudentData();
}, []);

  if (isLoading) {
    return (
      <DashboardLayout currentPage="dashboard">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!studentData) {
    return (
      <DashboardLayout currentPage="dashboard">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="p-6">
            <p>Unable to load dashboard. Please try logging in again.</p>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="mt-4"
            >
              Return to Login
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }


  return (
      <DashboardLayout 
        currentPage="dashboard"
        userData={studentData}
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
    )
}
