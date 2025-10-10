'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface StudentData {
  student_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  college_id: number;
  college_name: string;
  program: string;
  current_year: number;
  current_semester: number;
  current_gpa: string;
  technical_skills: Record<string, number>;
  soft_skills: Record<string, number>;
  language_skills: Record<string, number>;
  academic_interests: string[];
  industry_focus: string[];
  career_quiz_answers: Record<string, string>;
  primary_goal: string;
  secondary_goal: string;
  timeline: string;
  location_preference: string;
  intensity_level: string;
}

interface StudentDataContextType {
  studentData: StudentData | null;
  isLoading: boolean;
  error: string | null;
  refetchStudentData: () => Promise<void>;
}

const StudentDataContext = createContext<StudentDataContextType | undefined>(undefined);

export function StudentDataProvider({ children }: { children: ReactNode }) {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentData = async () => {
    try {
      setIsLoading(true);
      setError(null);

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
      } else {
        throw new Error("Invalid API response");
      }

    } catch (err) {
      console.error('Error fetching student data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  return (
    <StudentDataContext.Provider value={{ 
      studentData, 
      isLoading, 
      error, 
      refetchStudentData: fetchStudentData 
    }}>
      {children}
    </StudentDataContext.Provider>
  );
}

export function useStudentData() {
  const context = useContext(StudentDataContext);
  if (context === undefined) {
    throw new Error('useStudentData must be used within a StudentDataProvider');
  }
  return context;
}