import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import jwt from 'jsonwebtoken'
import { analyzeGitHubProfile } from '@/lib/integrations/githubAnalyzer'
import { analyzeLeetCodeProfile, LeetCodeUserNotFoundError } from '@/lib/integrations/leetcodeAnalyzer'
import { flattenGitHubSkills, flattenLeetCodeSkills, mergeSkills } from '@/lib/skill-engine/mergeSkills'
import { ensureProfessionalSchema } from '@/lib/schema'


export async function POST(req: NextRequest) {
  let connection;
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_session')?.value

    if (!token) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })

    let decoded: any;
    try { decoded = jwt.verify(token, process.env.JWT_SECRET!); }
    catch { return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 }) }

    const professionalId = decoded.id
    const userRole = decoded.role

    if (!professionalId || userRole !== 'professional') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Professional access required.' }, { status: 403 })
    }

    const body = await req.json()
    const nestedUpdates = body?.updates && typeof body.updates === 'object' ? body.updates : {}
    const {
      firstName, lastName, phone, company, designation,
      linkedin, github, leetcode, portfolio,
      skills, projects, certifications, career_goals,
      preferred_learning_style, level, profile_picture,
    } = { ...nestedUpdates, ...body }

    const targetProfessionalId = body.professionalId ?? professionalId

    const toJsonText = (value: unknown) => {
      if (typeof value === 'string') return value
      if (value === undefined) return undefined
      return JSON.stringify(value)
    }

    // Build update query
    const updates: string[] = []
    const values: any[] = []

    if (firstName !== undefined)   { updates.push('first_name = ?');   values.push(firstName) }
    if (lastName !== undefined)    { updates.push('last_name = ?');    values.push(lastName) }
    if (phone !== undefined)       { updates.push('phone = ?');        values.push(phone) }
    if (company !== undefined)     { updates.push('company = ?');      values.push(company) }
    if (designation !== undefined) { updates.push('designation = ?');  values.push(designation) }
    if (linkedin !== undefined)    { updates.push('linkedin = ?');     values.push(linkedin) }
    if (github !== undefined)      { updates.push('github = ?');       values.push(github) }
    if (leetcode !== undefined)    { updates.push('leetcode_url = ?');  values.push(leetcode) }
    if (portfolio !== undefined)   { updates.push('portfolio = ?');    values.push(portfolio) }
    if (skills !== undefined)      { updates.push('skills = ?');       values.push(toJsonText(skills)) }
    if (projects !== undefined)    { updates.push('projects = ?');     values.push(toJsonText(projects)) }
    if (certifications !== undefined) { updates.push('certifications = ?'); values.push(certifications) }
    if (career_goals !== undefined)   { updates.push('career_goals = ?');   values.push(career_goals) }
    if (preferred_learning_style !== undefined) { updates.push('preferred_learning_style = ?'); values.push(preferred_learning_style) }
    if (level !== undefined)       { updates.push('level = ?');        values.push(level) }
    if (profile_picture !== undefined) {
      updates.push('profile_picture_base64 = ?')
      values.push(profile_picture)
      updates.push('profile_picture_mime = ?')
      values.push('image/url')
    }

    updates.push('updated_at = NOW()')

    if (updates.length <= 1) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 })
    }

    values.push(targetProfessionalId)

    const query = `UPDATE professionals SET ${updates.join(', ')} WHERE id = ?`
    console.log('🔄 Updating professional profile:', { professionalId: targetProfessionalId, updates: updates.length - 1 })

    connection = await pool.getConnection()
    await ensureProfessionalSchema(connection)
    await connection.execute(query, values)
    console.log('✅ Professional profile updated successfully')
    connection.release()
    connection = undefined

    // ── If github or leetcode changed, trigger skill re-merge in background ──
    if (github !== undefined || leetcode !== undefined || skills !== undefined) {
      try {
        // Fetch latest stored values
        const [rows]: any = await pool.execute(
          'SELECT github, leetcode_url, skills FROM professionals WHERE id = ?',
          [targetProfessionalId]
        )
        const prof = rows[0] || {}
        const ghUsername = (github ?? prof.github ?? '').replace(/https?:\/\/(www\.)?github\.com\//i, '').trim()
        const lcUsername = (leetcode ?? prof.leetcode_url ?? '').replace(/https?:\/\/(www\.)?leetcode\.com\/u?\/?/i, '').replace(/\/+$/, '').trim()
        
        let ghSkills: string[] | null = null
        let lcSkills: string[] | null = null
        let manualSkills: string[] = []

        // Parse manual skills from profile
        try {
          const rawSkills = skills ?? prof.skills
          manualSkills = Array.isArray(rawSkills)
            ? rawSkills
            : (typeof rawSkills === 'string' ? JSON.parse(rawSkills) : [])
        } catch { manualSkills = [] }

        let ghSkillProfile = null
        let lcDsaProfile = null

        // Analyze GitHub
        if (ghUsername) {
          try {
            const gh = await analyzeGitHubProfile(ghUsername)
            ghSkillProfile = gh?.skillProfile ?? null
          } catch (e) { console.warn('[SkillMerge] GitHub analysis failed:', e instanceof Error ? e.message : e) }
        }

        // Analyze LeetCode  
        if (lcUsername) {
          try {
            const lc = await analyzeLeetCodeProfile(lcUsername)
            lcDsaProfile = lc?.dsaProfile ?? null
          } catch (e) {
            if (e instanceof LeetCodeUserNotFoundError) {
              console.warn(`[SkillMerge] LeetCode profile not found for ${lcUsername}; skipping DSA merge.`)
            } else {
              console.warn('[SkillMerge] LeetCode analysis failed:', e instanceof Error ? e.message : e)
            }
          }
        }

        // Also include manual resume skills as string array
        const resumeSkills = manualSkills.length > 0
          ? { technical_skills: manualSkills, frameworks: [], tools: [], soft_skills: [] }
          : null

        // Merge
        if (ghSkillProfile || lcDsaProfile || resumeSkills) {
          const merged = mergeSkills({
            github:   ghSkillProfile ? flattenGitHubSkills(ghSkillProfile) : undefined,
            leetcode: lcDsaProfile   ? flattenLeetCodeSkills(lcDsaProfile) : undefined,
            resume:   resumeSkills   ? manualSkills as string[]            : undefined,
          })

          // Persist to professional_skills table (create if needed via raw insert)
          const conn2 = await pool.getConnection()
          try {
            await ensureProfessionalSchema(conn2)
            // Ensure professional_skills table exists
            await conn2.execute(`
              CREATE TABLE IF NOT EXISTS professional_skills (
                id INT AUTO_INCREMENT PRIMARY KEY,
                professional_id INT NOT NULL,
                skill_name VARCHAR(255) NOT NULL,
                proficiency FLOAT DEFAULT 5,
                confidence FLOAT DEFAULT 0.5,
                sources JSON,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY idx_prof_skill (professional_id, skill_name),
                INDEX idx_professional (professional_id)
              )
            `)

            for (const s of merged.skills) {
              await conn2.execute(
                `INSERT INTO professional_skills (professional_id, skill_name, proficiency, confidence, sources)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE proficiency = ?, confidence = ?, sources = ?, updated_at = NOW()`,
                [
                  targetProfessionalId, s.skill, s.proficiency, s.confidence, JSON.stringify(s.sources),
                  s.proficiency, s.confidence, JSON.stringify(s.sources)
                ]
              )
            }
            console.log(`[SkillMerge] Saved ${merged.skills.length} skills for professional #${targetProfessionalId}`)
          } finally {
            conn2.release()
          }
        }
      } catch (e) {
        console.warn('[SkillMerge] Background skill merge failed (non-fatal):', e instanceof Error ? e.message : e)
      }
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' })

  } catch (error: any) {
    console.error('❌ Error updating professional profile:', error)
    return NextResponse.json({ success: false, error: 'Failed to update profile', details: error.message }, { status: 500 })
  } finally {
    if (connection) connection.release();
  }
}