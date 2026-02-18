/**
 * POST /api/career-tracks/cron/task-reminder
 *
 * Sends email reminders to students who have incomplete tasks for today.
 * Should be called by a cron job at 8 PM daily.
 *
 * Protected by a CRON_SECRET header to prevent unauthorized calls.
 *
 * In production, set up a cron job (Vercel Cron, GitHub Actions, etc.)
 * to POST to this endpoint daily at 20:00 IST with:
 *   Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

async function sendReminderEmail(email: string, name: string, taskCount: number, targetName: string) {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Task Reminder - StudentPath</title>
    </head>
    <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#1e293b;border-radius:16px;overflow:hidden;margin-top:20px;">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 30px;text-align:center;">
          <div style="font-size:48px;margin-bottom:12px;">⚡</div>
          <h1 style="color:white;margin:0;font-size:24px;font-weight:700;">Don't Break Your Streak!</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">You have pending tasks for today</p>
        </div>

        <!-- Content -->
        <div style="padding:32px 30px;">
          <p style="color:#e2e8f0;font-size:17px;margin:0 0 20px;">Hey <strong>${name}</strong> 👋</p>
          
          <div style="background:#0f172a;border-radius:12px;padding:20px;margin-bottom:24px;border-left:4px solid #f59e0b;">
            <p style="color:#fbbf24;font-size:14px;font-weight:600;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">⚠️ Reminder</p>
            <p style="color:#e2e8f0;font-size:16px;margin:0;">
              You have <strong style="color:#f59e0b;">${taskCount} task${taskCount > 1 ? "s" : ""}</strong> pending today 
              for your <strong style="color:#a78bfa;">${targetName}</strong> preparation plan.
            </p>
          </div>

          <div style="background:#0f172a;border-radius:12px;padding:20px;margin-bottom:24px;">
            <p style="color:#94a3b8;font-size:14px;margin:0 0 12px;">🔥 Why complete today's tasks?</p>
            <ul style="color:#e2e8f0;font-size:14px;margin:0;padding-left:20px;line-height:1.8;">
              <li>Maintain your daily streak for bonus XP</li>
              <li>Stay ahead of the leaderboard</li>
              <li>Unlock achievement badges</li>
              <li>Build consistent preparation habits</li>
            </ul>
          </div>

          <div style="text-align:center;margin:32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/career-tracks/my-plan" 
               style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;">
              Complete Today's Tasks →
            </a>
          </div>

          <p style="color:#64748b;font-size:13px;text-align:center;margin:0;">
            Keep going! Every task completed brings you closer to your goal. 🎯
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#0f172a;padding:20px 30px;text-align:center;border-top:1px solid #1e293b;">
          <p style="color:#475569;font-size:12px;margin:0;">© 2025 StudentPath. You're receiving this because you have an active career plan.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
        from: `"StudentPath Career OS" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `⚡ ${taskCount} Task${taskCount > 1 ? "s" : ""} Pending Today — Don't Break Your Streak!`,
        html,
    });
}

export async function POST(request: NextRequest) {
    // Validate cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conn = await pool.getConnection();
    try {
        // Find students with incomplete tasks for today
        const [rows]: any = await conn.execute(
            `SELECT 
               s.email,
               CONCAT(s.first_name, ' ', s.last_name) as name,
               cp.target_name,
               COUNT(ct.id) as pending_count
             FROM students s
             JOIN career_plans cp ON s.student_id = cp.student_id
             JOIN career_tasks ct ON cp.id = ct.plan_id
             WHERE ct.task_date = CURDATE()
               AND ct.is_completed = FALSE
               AND cp.is_active = TRUE
             GROUP BY s.email, s.first_name, s.last_name, cp.target_name`
        );

        let sent = 0;
        let failed = 0;

        for (const row of rows) {
            try {
                await sendReminderEmail(row.email, row.name, row.pending_count, row.target_name);
                sent++;
            } catch (err) {
                console.error(`Failed to send reminder to ${row.email}:`, err);
                failed++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Reminders sent: ${sent}, failed: ${failed}`,
            total: rows.length,
        });
    } finally {
        conn.release();
    }
}
