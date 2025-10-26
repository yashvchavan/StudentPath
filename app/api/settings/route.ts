// app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import pool from "@/lib/db"

// ---------------------- GET → Fetch user settings ----------------------
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const studentCookie = cookieStore.get("studentData")?.value

    if (!studentCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const studentData = JSON.parse(studentCookie)
    const { student_id, token, isAuthenticated } = studentData

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const connection = await pool.getConnection()

    // Fetch student profile - UPDATED to match your schema
    const [studentRows] = await connection.execute<any[]>(
      `SELECT student_id, first_name, last_name, email, phone, 
              college_id, college, program, current_year, current_semester,
              current_gpa, department, gender, date_of_birth, country,
              academic_interests, career_quiz_answers, technical_skills,
              soft_skills, language_skills, primary_goal, secondary_goal,
              timeline, location_preference, industry_focus, intensity_level,
              created_at, updated_at, profile_picture
       FROM Students 
       WHERE student_id = ?`,
      [student_id]
    )

    if (!studentRows || studentRows.length === 0) {
      connection.release()
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    const student = studentRows[0]

    // Fetch college name using token from cookie
    let collegeName = student.college || "Not specified"
    let collegeData = null
    
    if (token) {
      const [collegeRows] = await connection.execute<any[]>(
        `SELECT id, college_name, email, phone, country, state, city, 
                website, established_year, college_type, accreditation
         FROM colleges 
         WHERE college_token = ?`,
        [token]
      )
      
      if (collegeRows && collegeRows.length > 0) {
        collegeData = collegeRows[0]
        collegeName = collegeData.college_name
      }
    }

    // Fetch user settings (notifications, privacy, preferences)
    const [settingsRows] = await connection.execute<any[]>(
      `SELECT * FROM user_settings WHERE student_id = ?`,
      [student_id]
    )

    connection.release()

    let settings = null
    if (settingsRows && settingsRows.length > 0) {
      settings = settingsRows[0]
    } else {
      // Return default settings if none exist
      settings = {
        email_notifications: true,
        push_notifications: true,
        assignment_reminders: true,
        goal_updates: true,
        weekly_reports: false,
        course_updates: true,
        profile_visibility: true,
        progress_sharing: false,
        analytics_opt_in: true,
        theme: "system",
        language: "en",
        timezone: "Asia/Kolkata"
      }
    }

    return NextResponse.json({
      success: true,
      profile: {
        student_id: student.student_id,
        name: `${student.first_name} ${student.last_name}`,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        phone: student.phone || "",
        college: collegeName,
        college_id: collegeData?.id || student.college_id,
        college_details: collegeData ? {
          name: collegeData.college_name,
          email: collegeData.email,
          phone: collegeData.phone,
          location: `${collegeData.city}, ${collegeData.state}, ${collegeData.country}`,
          website: collegeData.website,
          established_year: collegeData.established_year,
          type: collegeData.college_type,
          accreditation: collegeData.accreditation
        } : null,
        program: student.program || "",
        department: student.department || "",
        current_year: student.current_year || 1,
        semester: student.current_semester || 1,
        current_gpa: student.current_gpa || null,
        gender: student.gender || "",
        date_of_birth: student.date_of_birth || null,
        country: student.country || "",
        bio: student.academic_interests || "",
        profile_picture: student.profile_picture || null, // You don't have this column, will need to add it
        academic_interests: student.academic_interests || "",
        technical_skills: student.technical_skills || "",
        soft_skills: student.soft_skills || "",
        language_skills: student.language_skills || "",
        primary_goal: student.primary_goal || "",
        secondary_goal: student.secondary_goal || "",
        timeline: student.timeline || "",
        location_preference: student.location_preference || "",
        industry_focus: student.industry_focus || "",
        intensity_level: student.intensity_level || "",
        created_at: student.created_at,
        updated_at: student.updated_at
      },
      settings: {
        notifications: {
          emailNotifications: settings.email_notifications ?? true,
          pushNotifications: settings.push_notifications ?? true,
          assignmentReminders: settings.assignment_reminders ?? true,
          goalUpdates: settings.goal_updates ?? true,
          weeklyReports: settings.weekly_reports ?? false,
          courseUpdates: settings.course_updates ?? true
        },
        privacy: {
          profileVisibility: settings.profile_visibility ?? true,
          progressSharing: settings.progress_sharing ?? false,
          analyticsOptIn: settings.analytics_opt_in ?? true
        },
        preferences: {
          theme: settings.theme || "system",
          language: settings.language || "en",
          timezone: settings.timezone || "Asia/Kolkata"
        }
      }
    })

  } catch (error: any) {
    console.error("❌ Error fetching settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings", details: error.message },
      { status: 500 }
    )
  }
}

// ---------------------- PUT → Update user settings ----------------------
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const studentCookie = cookieStore.get("studentData")?.value

    if (!studentCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const studentData = JSON.parse(studentCookie)
    const { student_id, isAuthenticated } = studentData

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await req.json()
    const { profile, settings } = body

    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // Update profile information - UPDATED to match your schema
      if (profile) {
        const updateFields: string[] = []
        const updateValues: any[] = []

        if (profile.first_name !== undefined) {
          updateFields.push("first_name = ?")
          updateValues.push(profile.first_name)
        }
        if (profile.last_name !== undefined) {
          updateFields.push("last_name = ?")
          updateValues.push(profile.last_name)
        }
        if (profile.email !== undefined) {
          updateFields.push("email = ?")
          updateValues.push(profile.email)
        }
        if (profile.phone !== undefined) {
          updateFields.push("phone = ?")
          updateValues.push(profile.phone)
        }
        if (profile.program !== undefined) {
          updateFields.push("program = ?")
          updateValues.push(profile.program)
        }
        if (profile.department !== undefined) {
          updateFields.push("department = ?")
          updateValues.push(profile.department)
        }
        if (profile.semester !== undefined) {
          updateFields.push("current_semester = ?")
          updateValues.push(profile.semester)
        }
        if (profile.current_year !== undefined) {
          updateFields.push("current_year = ?")
          updateValues.push(profile.current_year)
        }
        if (profile.bio !== undefined) {
          updateFields.push("academic_interests = ?")
          updateValues.push(profile.bio)
        }
        if (profile.gender !== undefined) {
          updateFields.push("gender = ?")
          updateValues.push(profile.gender)
        }
        if (profile.date_of_birth !== undefined) {
          updateFields.push("date_of_birth = ?")
          updateValues.push(profile.date_of_birth)
        }
        if (profile.country !== undefined) {
          updateFields.push("country = ?")
          updateValues.push(profile.country)
        }
        if (profile.technical_skills !== undefined) {
          updateFields.push("technical_skills = ?")
          updateValues.push(profile.technical_skills)
        }
        if (profile.soft_skills !== undefined) {
          updateFields.push("soft_skills = ?")
          updateValues.push(profile.soft_skills)
        }
        if (profile.language_skills !== undefined) {
          updateFields.push("language_skills = ?")
          updateValues.push(profile.language_skills)
        }
        if (profile.primary_goal !== undefined) {
          updateFields.push("primary_goal = ?")
          updateValues.push(profile.primary_goal)
        }
        if (profile.secondary_goal !== undefined) {
          updateFields.push("secondary_goal = ?")
          updateValues.push(profile.secondary_goal)
        }
        if (profile.timeline !== undefined) {
          updateFields.push("timeline = ?")
          updateValues.push(profile.timeline)
        }
        if (profile.location_preference !== undefined) {
          updateFields.push("location_preference = ?")
          updateValues.push(profile.location_preference)
        }
        if (profile.industry_focus !== undefined) {
          updateFields.push("industry_focus = ?")
          updateValues.push(profile.industry_focus)
        }
        if (profile.intensity_level !== undefined) {
          updateFields.push("intensity_level = ?")
          updateValues.push(profile.intensity_level)
        }
        if (profile.current_gpa !== undefined) {
          updateFields.push("current_gpa = ?")
          updateValues.push(profile.current_gpa)
        }

        if (updateFields.length > 0) {
          updateFields.push("updated_at = NOW()")
          updateValues.push(student_id)

          await connection.execute(
            `UPDATE Students SET ${updateFields.join(", ")} WHERE student_id = ?`,
            updateValues
          )
        }
      }

      // Update settings
      if (settings) {
        const { notifications, privacy, preferences } = settings

        // Check if settings exist
        const [existingSettings] = await connection.execute<any[]>(
          `SELECT settings_id FROM user_settings WHERE student_id = ?`,
          [student_id]
        )

        const settingsData: any = {}

        if (notifications) {
          settingsData.email_notifications = notifications.emailNotifications
          settingsData.push_notifications = notifications.pushNotifications
          settingsData.assignment_reminders = notifications.assignmentReminders
          settingsData.goal_updates = notifications.goalUpdates
          settingsData.weekly_reports = notifications.weeklyReports
          settingsData.course_updates = notifications.courseUpdates
        }

        if (privacy) {
          settingsData.profile_visibility = privacy.profileVisibility
          settingsData.progress_sharing = privacy.progressSharing
          settingsData.analytics_opt_in = privacy.analyticsOptIn
        }

        if (preferences) {
          settingsData.theme = preferences.theme
          settingsData.language = preferences.language
          settingsData.timezone = preferences.timezone
        }

        if (existingSettings.length > 0) {
          // Update existing settings
          const updateFields: string[] = []
          const updateValues: any[] = []

          for (const [key, value] of Object.entries(settingsData)) {
            updateFields.push(`${key} = ?`)
            updateValues.push(value)
          }

          if (updateFields.length > 0) {
            updateFields.push("updated_at = NOW()")
            updateValues.push(student_id)

            await connection.execute(
              `UPDATE user_settings SET ${updateFields.join(", ")} WHERE student_id = ?`,
              updateValues
            )
          }
        } else {
          // Insert new settings
          const fields = ["student_id"]
          const placeholders = ["?"]
          const values: any[] = [student_id]

          for (const [key, value] of Object.entries(settingsData)) {
            fields.push(key)
            placeholders.push("?")
            values.push(value)
          }

          await connection.execute(
            `INSERT INTO user_settings (${fields.join(", ")}) VALUES (${placeholders.join(", ")})`,
            values
          )
        }
      }

      await connection.commit()
      connection.release()

      return NextResponse.json({
        success: true,
        message: "Settings updated successfully"
      })

    } catch (error) {
      await connection.rollback()
      connection.release()
      throw error
    }

  } catch (error: any) {
    console.error("❌ Error updating settings:", error)
    return NextResponse.json(
      { error: "Failed to update settings", details: error.message },
      { status: 500 }
    )
  }
}