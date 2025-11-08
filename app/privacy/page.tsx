"use client";
import Head from "next/head";
import React from "react";

export default function PrivacyPolicy() {
    const handleEmailClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        window.location.href = "mailto:privacy@studentpath.com?subject=Privacy%20Inquiry&body=Hi%20StudentPath%20team,";
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 py-12 px-6 md:px-20">
            <Head>
                <title>Privacy Policy — StudentPath</title>
                <meta
                    name="description"
                    content="Privacy Policy for StudentPath — Goal-Based Academic & Career Planner"
                />
            </Head>

            <main className="mx-auto max-w-4xl bg-white rounded-2xl shadow-md p-8">
                <header className="mb-6">
                    <h1 className="text-3xl font-semibold">Privacy Policy</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Last updated: <strong>November 8, 2025</strong>
                    </p>
                </header>

                <section className="space-y-6 text-sm leading-7">
                    <p>
                        At <strong>StudentPath</strong> (the "Platform"), we respect your privacy and are
                        committed to protecting your personal data. This Privacy Policy explains how we
                        collect, use, disclose, and safeguard your information when you use our platform,
                        which supports goal-based academic and career planning for students and partner
                        colleges.
                    </p>

                    <h2 className="text-lg font-medium">1. Information We Collect</h2>
                    <ul className="list-disc list-inside">
                        <li>
                            <strong>Personal Information:</strong> Name, email address, contact details,
                            college name, major, and year of study.
                        </li>
                        <li>
                            <strong>Account Data:</strong> Login credentials and tenant (college)
                            association.
                        </li>
                        <li>
                            <strong>Academic Information:</strong> Courses taken, grades (if entered), and
                            goal preferences.
                        </li>
                        <li>
                            <strong>AI Interaction Data:</strong> Queries made to the AI chatbot or RAG
                            module for planning and recommendations.
                        </li>
                        <li>
                            <strong>Affiliate Interaction Data:</strong> Clicks on third-party resources or
                            learning recommendations.
                        </li>
                        <li>
                            <strong>Technical Data:</strong> Device type, browser, IP address, and usage
                            analytics.
                        </li>
                    </ul>

                    <h2 className="text-lg font-medium">2. How We Use Your Information</h2>
                    <ul className="list-disc list-inside">
                        <li>Provide personalized academic and career recommendations.</li>
                        <li>Support AI RAG features for curriculum and goal alignment.</li>
                        <li>Improve the user experience and platform performance.</li>
                        <li>
                            Enable college administrators (Tenants) to monitor aggregate student progress.
                        </li>
                        <li>
                            Display affiliate resources and learning opportunities relevant to your goals.
                        </li>
                        <li>Comply with applicable legal obligations.</li>
                    </ul>

                    <h2 className="text-lg font-medium">3. Data Storage and Security</h2>
                    <p>
                        Your data is securely stored on our cloud infrastructure with encryption at rest
                        and in transit. Access to data is restricted to authorized personnel only. While
                        we take reasonable precautions to protect your data, no method of transmission or
                        storage is completely secure.
                    </p>

                    <h2 className="text-lg font-medium">4. Multi-Tenant Data Handling</h2>
                    <p>
                        Each college or institution (Tenant) operates a separate environment identified
                        by a unique Tenant ID. Your data is logically isolated per Tenant to maintain
                        privacy and prevent cross-institutional access.
                    </p>

                    <h2 className="text-lg font-medium">5. Use of AI & Automated Decision-Making</h2>
                    <p>
                        StudentPath employs AI-driven components (including GPT-4o-based RAG systems) to
                        personalize learning paths. These recommendations are generated algorithmically
                        and are intended to assist decision-making, not replace human judgment. AI data
                        inputs may be anonymized and used to train or improve models without revealing
                        your personal identity.
                    </p>

                    <h2 className="text-lg font-medium">6. Sharing of Information</h2>
                    <ul className="list-disc list-inside">
                        <li>
                            <strong>With Tenants:</strong> Colleges have access to student performance and
                            engagement data for their registered users.
                        </li>
                        <li>
                            <strong>With Service Providers:</strong> We share necessary data with hosting,
                            analytics, and AI providers for operational support.
                        </li>
                        <li>
                            <strong>With Affiliates:</strong> Anonymous usage data may be shared to improve
                            affiliate recommendation quality.
                        </li>
                        <li>
                            <strong>Legal Requirements:</strong> We may disclose information to comply with
                            applicable law or respond to lawful requests.
                        </li>
                    </ul>

                    <h2 className="text-lg font-medium">7. Cookies and Tracking Technologies</h2>
                    <p>
                        StudentPath uses cookies and similar technologies to enhance functionality,
                        remember preferences, and gather analytics. You can control cookie preferences
                        via your browser settings.
                    </p>

                    <h2 className="text-lg font-medium">8. Data Retention</h2>
                    <p>
                        We retain personal data as long as your account remains active or as required by
                        Tenants and applicable law. You may request deletion of your data via your account
                        settings or by contacting support.
                    </p>

                    <h2 className="text-lg font-medium">9. Your Rights</h2>
                    <ul className="list-disc list-inside">
                        <li>Access, correct, or delete your personal data.</li>
                        <li>Withdraw consent to data processing.</li>
                        <li>Request data portability.</li>
                        <li>File a complaint with a data protection authority.</li>
                    </ul>

                    <h2 className="text-lg font-medium">10. Third-Party Links</h2>
                    <p>
                        The Platform may include links to external learning or affiliate websites. We are
                        not responsible for their privacy practices or content. Please review each third
                        party’s privacy policy before engaging with them.
                    </p>

                    <h2 className="text-lg font-medium">11. Children’s Privacy</h2>
                    <p>
                        StudentPath is intended for college students and above. We do not knowingly
                        collect personal data from minors under the age of 16 without parental consent.
                    </p>

                    <h2 className="text-lg font-medium">12. Updates to This Policy</h2>
                    <p>
                        We may revise this Privacy Policy periodically. Material changes will be
                        communicated through the Platform or email notifications. Continued use after an
                        update indicates acceptance of the revised policy.
                    </p>

                    <h2 className="text-lg font-medium">13. Contact Us</h2>
                    <p>
                        For any questions or requests regarding this Privacy Policy, contact us at:
                        <br />
                        <strong>StudentPath Privacy Team</strong>
                        <br />
                        Email:{" "}
                        <a
                            href="https://mail.google.com/mail/?view=cm&to=vijishvanya@gmail.com&su=Privacy%20Inquiry"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline"
                        >
                            privacy@studentpath.com
                        </a>
                    </p>

                    {/* <p className="text-xs text-gray-500">
                        Note: This document is a general template and not legal advice. Please consult
                        legal counsel before publishing to ensure compliance with your applicable data
                        protection laws (e.g., GDPR, CCPA).
                    </p> */}
                </section>

                <footer className="mt-8 text-sm text-gray-600">
                    <p>© {new Date().getFullYear()} StudentPath. All rights reserved.</p>
                </footer>
            </main>
        </div>
    );
}
