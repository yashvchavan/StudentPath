/**
 * instrumentation.ts
 *
 * Next.js server instrumentation hook — runs once when the server starts.
 * Used to initialize the database tables.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
    // Only run on the Node.js server (not in the Edge runtime)
    if (process.env.NEXT_RUNTIME === "nodejs") {
        try {
            const { initializeDatabase } = await import("@/lib/db");
            await initializeDatabase();
            console.log("[Startup] Database initialized successfully");
        } catch (err) {
            console.error("[Startup] Database initialization failed:", err);
        }
    }
}
