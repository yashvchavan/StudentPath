/**
 * GET   /api/platform-admin/config — Return all platform config settings
 * PATCH /api/platform-admin/config — Update platform config settings
 */

import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import {
  isPlatformAdminAuthorized,
  platformAdminUnauthorizedResponse,
} from "@/lib/platform-admin";

// Default config keys and their descriptions
const CONFIG_SCHEMA = [
  // Trial
  { key: "free_trial_days", label: "Free Trial Duration (days)", defaultValue: "30", category: "trial" },
  // Pricing & Business
  { key: "pro_plan_amount_minor", label: "Pro Plan Price (smallest currency unit, e.g. cents/paise)", defaultValue: "321", category: "pricing" },
  { key: "pro_plan_currency", label: "Pro Plan Currency", defaultValue: "USD", category: "pricing" },
  { key: "pro_plan_duration_months", label: "Pro Plan Duration (months)", defaultValue: "12", category: "pricing" },
  { key: "pro_plan_display_price", label: "Pro Plan Display Price (shown to user)", defaultValue: "3.21", category: "pricing" },
  { key: "platform_pro_plan_monthly_price", label: "Platform MRR Calculation Price (₹/month)", defaultValue: "999", category: "pricing" },
  // Rate Limits
  { key: "rate_limit_ai_chat_free", label: "AI Chat — Free Plan (daily)", defaultValue: "30", category: "rate_limit" },
  { key: "rate_limit_ai_chat_pro", label: "AI Chat — Pro Plan (daily)", defaultValue: "500", category: "rate_limit" },
  { key: "rate_limit_career_track_free", label: "Plan Generation — Free Plan (weekly)", defaultValue: "1", category: "rate_limit" },
  { key: "rate_limit_career_track_pro", label: "Plan Generation — Pro Plan (weekly)", defaultValue: "4", category: "rate_limit" },
  { key: "rate_limit_resume_analysis_free", label: "Resume Analysis — Free Plan (weekly)", defaultValue: "1", category: "rate_limit" },
  { key: "rate_limit_resume_analysis_pro", label: "Resume Analysis — Pro Plan (weekly)", defaultValue: "5", category: "rate_limit" },
  { key: "rate_limit_recommendation_free", label: "Recommendations — Free Plan (daily)", defaultValue: "20", category: "rate_limit" },
  { key: "rate_limit_recommendation_pro", label: "Recommendations — Pro Plan (daily)", defaultValue: "200", category: "rate_limit" },
];

export async function GET(request: NextRequest) {
  try {
    if (!isPlatformAdminAuthorized(request)) {
      return platformAdminUnauthorizedResponse();
    }

    // Ensure table exists
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS platform_config (
          id INT AUTO_INCREMENT PRIMARY KEY,
          config_key VARCHAR(100) NOT NULL,
          config_value TEXT NOT NULL,
          scope ENUM('global','college') DEFAULT 'global',
          college_id INT NULL,
          updated_by VARCHAR(255) NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_config_scope (config_key, scope, college_id),
          FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
        )
      `);
    } catch { /* already exists */ }

    // Fetch all global configs
    const [globalRows]: any = await pool.execute(
      `SELECT config_key, config_value, updated_at FROM platform_config WHERE scope = 'global'`
    );

    const globalMap = new Map<string, { value: string; updatedAt: string }>();
    for (const row of globalRows) {
      globalMap.set(row.config_key, {
        value: row.config_value,
        updatedAt: row.updated_at,
      });
    }

    // Build config response with defaults
    const config = CONFIG_SCHEMA.map((item) => {
      const stored = globalMap.get(item.key);
      return {
        key: item.key,
        label: item.label,
        category: item.category,
        value: stored?.value ?? item.defaultValue,
        defaultValue: item.defaultValue,
        isCustomized: !!stored,
        updatedAt: stored?.updatedAt || null,
      };
    });

    // Fetch per-college configs
    const [collegeRows]: any = await pool.execute(
      `SELECT pc.config_key, pc.config_value, pc.college_id, pc.updated_at,
              c.college_name
       FROM platform_config pc
       LEFT JOIN colleges c ON pc.college_id = c.id
       WHERE pc.scope = 'college'
       ORDER BY pc.college_id, pc.config_key`
    );

    // Group by college
    const collegeConfigs: Record<number, { collegeName: string; configs: any[] }> = {};
    for (const row of collegeRows) {
      if (!collegeConfigs[row.college_id]) {
        collegeConfigs[row.college_id] = {
          collegeName: row.college_name || `College #${row.college_id}`,
          configs: [],
        };
      }
      collegeConfigs[row.college_id].configs.push({
        key: row.config_key,
        value: row.config_value,
        updatedAt: row.updated_at,
      });
    }

    return NextResponse.json({
      success: true,
      globalConfig: config,
      collegeConfigs,
      schema: CONFIG_SCHEMA,
    });
  } catch (error) {
    console.error("[Platform Admin Config GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isPlatformAdminAuthorized(request)) {
      return platformAdminUnauthorizedResponse();
    }

    const body = await request.json();
    const { configs, college_id } = body;

    // configs: Array<{ key: string, value: string }>
    if (!configs || !Array.isArray(configs)) {
      return NextResponse.json(
        { error: "configs array is required" },
        { status: 400 }
      );
    }

    const scope = college_id ? "college" : "global";
    const validKeys = new Set(CONFIG_SCHEMA.map((s) => s.key));
    const stringKeys = new Set(["pro_plan_currency", "pro_plan_display_price"]);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const { key, value } of configs) {
        if (!validKeys.has(key)) continue;

        let safeValue: string;
        if (stringKeys.has(key)) {
          // String config — just trim and store
          safeValue = String(value).trim();
          if (!safeValue) continue;
        } else {
          // Numeric config — validate
          const numValue = parseFloat(String(value));
          if (Number.isNaN(numValue) || numValue < 0) continue;
          safeValue = String(numValue);
        }

        if (college_id) {
          await connection.execute(
            `INSERT INTO platform_config (config_key, config_value, scope, college_id, updated_by)
             VALUES (?, ?, 'college', ?, 'platform-admin')
             ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_by = 'platform-admin'`,
            [key, safeValue, college_id]
          );
        } else {
          await connection.execute(
            `INSERT INTO platform_config (config_key, config_value, scope, college_id, updated_by)
             VALUES (?, ?, 'global', NULL, 'platform-admin')
             ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_by = 'platform-admin'`,
            [key, safeValue]
          );
        }
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    return NextResponse.json({
      success: true,
      message: `Platform config updated (${scope}${college_id ? ` for college #${college_id}` : ""})`,
    });
  } catch (error) {
    console.error("[Platform Admin Config PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update config" },
      { status: 500 }
    );
  }
}
