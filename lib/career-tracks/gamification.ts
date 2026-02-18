/**
 * gamification.ts — Deterministic backend gamification engine.
 *
 * GPT generates the plan structure once.
 * Everything else (XP, streaks, rewards, difficulty) is handled here.
 */

import pool from "@/lib/db";

// ─── Constants ────────────────────────────────────────────────────────────────

export const XP_RULES = {
    easy: 20,
    medium: 40,
    hard: 60,
    weeklyChallenge: 150,
    streakBonus: 100,
} as const;

export const REWARD_TIERS = [
    { xp: 500, badge: "Beginner Achiever", icon: "🌱", description: "You've taken your first steps!" },
    { xp: 1500, badge: "Consistency King", icon: "🔥", description: "Showing up every day!" },
    { xp: 3000, badge: "Placement Warrior", icon: "⚔️", description: "Halfway to the top!" },
    { xp: 5000, badge: "Elite Candidate", icon: "👑", description: "You're in the top tier!" },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CareerPlan {
    id: number;
    student_id: number;
    target_id: string;
    target_name: string;
    track_type: "placement" | "higher-studies";
    total_xp: number;
    current_streak: number;
    last_completed_date: string | null;
    progress: number;
    difficulty_level: "easy" | "medium" | "hard";
    is_active: boolean;
    created_at: string;
}

export interface CareerTask {
    id: number;
    plan_id: number;
    week_number: number;
    task_date: string | null;
    skill_focus: string;
    morning_task: string;
    evening_task: string;
    difficulty: "easy" | "medium" | "hard";
    xp: number;
    is_completed: boolean;
    completed_at: string | null;
}

export interface CareerReward {
    id: number;
    student_id: number;
    plan_id: number;
    badge_name: string;
    badge_icon: string;
    xp_threshold: number;
    unlocked_at: string;
}

export interface SkillRadarData {
    skill: string;
    completion_rate: number;
    completed: number;
    total: number;
}

export interface LeaderboardEntry {
    student_id: number;
    name: string;
    total_xp: number;
    rank: number;
}

// ─── XP & Streak Engine ───────────────────────────────────────────────────────

/**
 * Complete a task: update XP, streak, progress, check rewards.
 * Returns newly unlocked rewards (if any).
 */
export async function completeTask(
    taskId: number,
    planId: number,
    studentId: number
): Promise<{ newXp: number; newStreak: number; newRewards: CareerReward[]; newProgress: number }> {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Get task info
        const [taskRows]: any = await conn.execute(
            "SELECT * FROM career_tasks WHERE id = ? AND plan_id = ? AND is_completed = FALSE",
            [taskId, planId]
        );
        if (!taskRows.length) throw new Error("Task not found or already completed");
        const task: CareerTask = taskRows[0];

        // 2. Mark task complete
        await conn.execute(
            "UPDATE career_tasks SET is_completed = TRUE, completed_at = NOW() WHERE id = ?",
            [taskId]
        );

        // 3. Get current plan state
        const [planRows]: any = await conn.execute(
            "SELECT * FROM career_plans WHERE id = ? AND student_id = ?",
            [planId, studentId]
        );
        if (!planRows.length) throw new Error("Plan not found");
        const plan: CareerPlan = planRows[0];

        // 4. Calculate streak
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastDate = plan.last_completed_date ? new Date(plan.last_completed_date) : null;
        let newStreak = plan.current_streak;

        if (lastDate) {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const lastDateNorm = new Date(lastDate);
            lastDateNorm.setHours(0, 0, 0, 0);

            if (lastDateNorm.getTime() === yesterday.getTime()) {
                newStreak = plan.current_streak + 1;
            } else if (lastDateNorm.getTime() === today.getTime()) {
                newStreak = plan.current_streak; // already completed today
            } else {
                newStreak = 1; // streak broken
            }
        } else {
            newStreak = 1;
        }

        // 5. Calculate XP earned
        let xpEarned = task.xp;
        // Streak bonus every 7 days
        if (newStreak > 0 && newStreak % 7 === 0) {
            xpEarned += XP_RULES.streakBonus;
        }
        const newXp = plan.total_xp + xpEarned;

        // 6. Calculate progress
        const [countRows]: any = await conn.execute(
            "SELECT COUNT(*) as total, SUM(is_completed) as done FROM career_tasks WHERE plan_id = ?",
            [planId]
        );
        const total = countRows[0].total || 1;
        const done = countRows[0].done || 0;
        const newProgress = Math.round((done / total) * 100 * 100) / 100;

        // 7. Update plan
        await conn.execute(
            `UPDATE career_plans 
             SET total_xp = ?, current_streak = ?, last_completed_date = CURDATE(), progress = ?
             WHERE id = ?`,
            [newXp, newStreak, newProgress, planId]
        );

        // 8. Check and unlock rewards
        const newRewards: CareerReward[] = [];
        for (const tier of REWARD_TIERS) {
            if (newXp >= tier.xp) {
                try {
                    await conn.execute(
                        `INSERT IGNORE INTO career_rewards (student_id, plan_id, badge_name, badge_icon, xp_threshold)
                         VALUES (?, ?, ?, ?, ?)`,
                        [studentId, planId, tier.badge, tier.icon, tier.xp]
                    );
                    // Check if it was newly inserted
                    const [rewardRows]: any = await conn.execute(
                        `SELECT * FROM career_rewards 
                         WHERE student_id = ? AND plan_id = ? AND badge_name = ? 
                         AND unlocked_at >= NOW() - INTERVAL 5 SECOND`,
                        [studentId, planId, tier.badge]
                    );
                    if (rewardRows.length > 0) {
                        newRewards.push(rewardRows[0]);
                    }
                } catch {
                    // Duplicate key = already unlocked, ignore
                }
            }
        }

        await conn.commit();
        return { newXp, newStreak, newRewards, newProgress };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

// ─── Auto Difficulty Adjustment ───────────────────────────────────────────────

/**
 * Checks weekly completion rate and adjusts difficulty_level.
 * Call this at the end of each week (or on demand).
 */
export async function adjustDifficulty(planId: number): Promise<"easy" | "medium" | "hard"> {
    const conn = await pool.getConnection();
    try {
        // Get tasks from the last 7 days
        const [rows]: any = await conn.execute(
            `SELECT COUNT(*) as total, SUM(is_completed) as done
             FROM career_tasks
             WHERE plan_id = ? AND task_date >= CURDATE() - INTERVAL 7 DAY`,
            [planId]
        );
        const total = rows[0].total || 0;
        const done = rows[0].done || 0;
        const rate = total > 0 ? (done / total) * 100 : 50;

        let newDifficulty: "easy" | "medium" | "hard" = "medium";
        if (rate >= 90) newDifficulty = "hard";
        else if (rate < 50) newDifficulty = "easy";

        await conn.execute(
            "UPDATE career_plans SET difficulty_level = ? WHERE id = ?",
            [newDifficulty, planId]
        );
        return newDifficulty;
    } finally {
        conn.release();
    }
}

// ─── Skill Radar ──────────────────────────────────────────────────────────────

export async function getSkillRadarData(planId: number): Promise<SkillRadarData[]> {
    const conn = await pool.getConnection();
    try {
        const [rows]: any = await conn.execute(
            `SELECT 
               skill_focus,
               COUNT(*) as total,
               SUM(is_completed) as completed,
               ROUND(SUM(is_completed) * 100.0 / COUNT(*), 1) as completion_rate
             FROM career_tasks
             WHERE plan_id = ? AND skill_focus IS NOT NULL AND skill_focus != ''
             GROUP BY skill_focus
             ORDER BY completion_rate DESC`,
            [planId]
        );
        return rows.map((r: any) => ({
            skill: r.skill_focus,
            completion_rate: parseFloat(r.completion_rate) || 0,
            completed: r.completed || 0,
            total: r.total || 0,
        }));
    } finally {
        conn.release();
    }
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
    const conn = await pool.getConnection();
    try {
        // Embed limit directly — mysql2 prepared statements don't support LIMIT ?
        const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
        const [rows]: any = await conn.query(
            `SELECT 
               s.student_id,
               CONCAT(s.first_name, ' ', s.last_name) as name,
               SUM(cp.total_xp) as total_xp
             FROM students s
             JOIN career_plans cp ON s.student_id = cp.student_id
             WHERE cp.is_active = 1
             GROUP BY s.student_id, s.first_name, s.last_name
             ORDER BY total_xp DESC
             LIMIT ${safeLimit}`
        );
        return rows.map((r: any, idx: number) => ({
            student_id: r.student_id,
            name: r.name,
            total_xp: Number(r.total_xp) || 0,
            rank: idx + 1,
        }));
    } finally {
        conn.release();
    }
}

export async function deletePlan(planId: number, studentId: number): Promise<boolean> {
    const conn = await pool.getConnection();
    try {
        // Hard delete — cascade removes career_tasks and career_rewards too
        const [result]: any = await conn.execute(
            "DELETE FROM career_plans WHERE id = ? AND student_id = ?",
            [planId, studentId]
        );
        return result.affectedRows > 0;
    } finally {
        conn.release();
    }
}

// ─── Plan Helpers ─────────────────────────────────────────────────────────────

export async function getPlanWithTasks(planId: number, studentId: number) {
    const conn = await pool.getConnection();
    try {
        const [planRows]: any = await conn.execute(
            "SELECT * FROM career_plans WHERE id = ? AND student_id = ? AND is_active = 1",
            [planId, studentId]
        );
        if (!planRows.length) return null;

        const [taskRows]: any = await conn.execute(
            "SELECT * FROM career_tasks WHERE plan_id = ? ORDER BY week_number, id",
            [planId]
        );

        const [rewardRows]: any = await conn.execute(
            "SELECT * FROM career_rewards WHERE plan_id = ? AND student_id = ? ORDER BY xp_threshold",
            [planId, studentId]
        );

        return {
            plan: planRows[0] as CareerPlan,
            tasks: taskRows as CareerTask[],
            rewards: rewardRows as CareerReward[],
        };
    } finally {
        conn.release();
    }
}

export async function getStudentPlans(studentId: number): Promise<CareerPlan[]> {
    const conn = await pool.getConnection();
    try {
        const [rows]: any = await conn.execute(
            "SELECT * FROM career_plans WHERE student_id = ? AND is_active = 1 ORDER BY created_at DESC",
            [studentId]
        );
        return rows as CareerPlan[];
    } finally {
        conn.release();
    }
}

// ─── Task Seeder (converts GPT milestones → DB tasks) ─────────────────────────

export interface MilestoneInput {
    week: number;
    title: string;
    tasks: string[];
    resources: string[];
    targetSkills: string[];
}

export async function seedTasksFromMilestones(
    planId: number,
    milestones: MilestoneInput[],
    difficulty: "easy" | "medium" | "hard" = "medium",
    planCreatedAt?: Date
): Promise<void> {
    const conn = await pool.getConnection();
    try {
        const xpPerTask = XP_RULES[difficulty];
        const startDate = planCreatedAt || new Date();

        for (const milestone of milestones) {
            const weekOffset = (milestone.week - 1) * 7;
            const skillFocus = milestone.targetSkills[0] || milestone.title;

            // Split tasks into morning/evening pairs
            const taskPairs: { morning: string; evening: string }[] = [];
            for (let i = 0; i < milestone.tasks.length; i += 2) {
                taskPairs.push({
                    morning: milestone.tasks[i] || "",
                    evening: milestone.tasks[i + 1] || milestone.tasks[i] || "",
                });
            }

            for (let dayIdx = 0; dayIdx < taskPairs.length; dayIdx++) {
                const taskDate = new Date(startDate);
                taskDate.setDate(taskDate.getDate() + weekOffset + dayIdx);

                await conn.execute(
                    `INSERT INTO career_tasks 
                     (plan_id, week_number, task_date, skill_focus, morning_task, evening_task, difficulty, xp)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        planId,
                        milestone.week,
                        taskDate.toISOString().split("T")[0],
                        skillFocus,
                        taskPairs[dayIdx].morning,
                        taskPairs[dayIdx].evening,
                        difficulty,
                        xpPerTask,
                    ]
                );
            }
        }
    } finally {
        conn.release();
    }
}
