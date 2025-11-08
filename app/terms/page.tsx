import Head from 'next/head'

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-12 px-6 md:px-20">
      <Head>
        <title>Terms & Conditions — StudentPath</title>
        <meta name="description" content="Terms and Conditions for StudentPath — Goal-Based Academic & Career Planner" />
      </Head>

      <main className="mx-auto max-w-4xl bg-white rounded-2xl shadow-md p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold">Terms & Conditions</h1>
          <p className="mt-2 text-sm text-gray-600">Last updated: <strong>November 8, 2025</strong></p>
        </header>

        <section className="space-y-6 text-sm leading-7">
          <p>
            Welcome to <strong>StudentPath</strong> (the "Platform"), a multi-tenant SaaS application that
            provides goal-based academic and career planning tools for students and partner colleges ("Tenants").
            These Terms & Conditions ("Terms") govern your access to and use of the Platform. By accessing or
            using StudentPath you agree to be bound by these Terms. If you do not agree, do not use the Platform.
          </p>

          <h2 className="text-lg font-medium">1. Definitions</h2>
          <ul className="list-disc list-inside">
            <li><strong>Platform</strong> — StudentPath and all associated websites, services and APIs.</li>
            <li><strong>Tenant</strong> — A college, university, or other educational organization using a dedicated configuration of the Platform.</li>
            <li><strong>User</strong> — Any individual accessing the Platform, including students, administrators, faculty, mentors.</li>
            <li><strong>Affiliate Resources</strong> — Third-party learning resources, links or offers surfaced by the Platform.</li>
            <li><strong>RAG</strong> — Retrieval-Augmented Generation features powered by integrated AI services (e.g., GPT-4o).</li>
          </ul>

          <h2 className="text-lg font-medium">2. Eligibility</h2>
          <p>
            You must be at least 16 years old (or the minimum legal age in your jurisdiction) to use the Platform. If
            you are under the minimum age, you may use the Platform only with the involvement of a parent or legal guardian.
          </p>

          <h2 className="text-lg font-medium">3. Account Registration & Tenant Selection</h2>
          <p>
            Users must provide accurate information when creating accounts. During signup you will select or be associated
            with a Tenant (college). Each Tenant may apply its own rules, policies and privacy settings. Tenants are
            responsible for the content they upload and the way they configure the Platform for their students.
          </p>

          <h2 className="text-lg font-medium">4. Tenant & Admin Responsibilities</h2>
          <p>
            Tenants (college admins) may upload curricula, configure branding, and set AI RAG rules for their community.
            Tenants certify that they have the right to upload and process any course PDFs, materials, or student data.
            StudentPath is not responsible for Tenant-supplied content or for Tenant-specific decisions made through the
            Platform.
          </p>

          <h2 className="text-lg font-medium">5. Use of the Platform</h2>
          <p>
            You agree to use the Platform lawfully and in compliance with Tenant policies. Prohibited actions include:
            attempt to reverse-engineer the service, circumvent security or tenant restrictions, upload illegal content,
            or misuse the Platform for commercial resale without express written permission.
          </p>

          <h2 className="text-lg font-medium">6. AI Features, RAG & Disclaimers</h2>
          <p>
            The Platform uses AI-driven features (including Retrieval-Augmented Generation) to provide personalized
            recommendations, curriculum extraction and goal-path suggestions. These outputs are for informational
            purposes only and do not constitute professional advice (academic, legal, financial, or career advice).
            While we strive for accuracy, AI-generated content may be incomplete, out-of-date, or incorrect. Users and
            Tenants should independently verify important decisions (course selection, internships, certifications,
            financial commitments).
          </p>

          <h2 className="text-lg font-medium">7. Affiliate Links & Recommendations</h2>
          <p>
            The Platform may display affiliate resources and third-party learning recommendations; StudentPath may
            receive compensation from affiliate partners. We do not warrant the quality or availability of affiliate
            resources. Use of any third-party service is at your own risk and governed by the third party's terms.
          </p>

          <h2 className="text-lg font-medium">8. Intellectual Property</h2>
          <p>
            StudentPath, its logos, UI, features, source code, and documentation are the property of the Platform owner
            and its licensors. Tenants retain ownership of content they upload (course PDFs, logos, campus announcements).
            By uploading content, Tenants grant StudentPath a license to store, index and process that content to provide
            the Platform services.
          </p>

          <h2 className="text-lg font-medium">9. Data, Privacy & Security</h2>
          <p>
            StudentPath processes personal data in accordance with its Privacy Policy. Data collected may include
            profile information, course progress, quizzes, and interaction logs. Tenants may have additional
            data controls and obligations. You should review the Privacy Policy (and any Tenant-specific policies)
            to understand data handling, retention and rights.
          </p>

          <h2 className="text-lg font-medium">10. Payments & Billing</h2>
          <p>
            If the Platform or a Tenant offers paid features, those are governed by separate payment terms or subscription
            agreements. Fees are non-refundable except where required by law or expressly stated otherwise.
          </p>

          <h2 className="text-lg font-medium">11. Suspension & Termination</h2>
          <p>
            We reserve the right to suspend or terminate access to accounts or Tenants for violations of these Terms,
            illegal activity, or security concerns. Upon termination, access to certain data may be restricted; Tenants
            should export any necessary data before termination where possible.
          </p>

          <h2 className="text-lg font-medium">12. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, StudentPath and its affiliates will not be liable for indirect,
            incidental, special, consequential or punitive damages, or for loss of profits, revenue, data or business
            opportunities arising from use of the Platform. Our aggregate liability for direct damages is limited to the
            amounts you actually paid for the services in the last 12 months, or a nominal amount if you paid nothing.
          </p>

          <h2 className="text-lg font-medium">13. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless StudentPath, its officers, employees and agents from any claims,
            losses, liabilities, damages and expenses arising from your breach of these Terms, your content, or your use
            of the Platform in violation of applicable law.
          </p>

          <h2 className="text-lg font-medium">14. Modifications to the Terms</h2>
          <p>
            We may modify these Terms from time to time. Material changes will be communicated to Tenants and Users via
            the Platform or email. Continued use after a change constitutes acceptance of the updated Terms.
          </p>

          <h2 className="text-lg font-medium">15. Governing Law & Dispute Resolution</h2>
          <p>
            These Terms are governed by the laws of the jurisdiction where StudentPath is incorporated (please update
            this clause to the correct governing law). Any dispute will be resolved via arbitration or courts as set
            out in the Platform's dispute policy.
          </p>

          <h2 className="text-lg font-medium">16. Contact</h2>
          <p>
            For questions about these Terms, please contact: <br />
            <strong>StudentPath Support</strong><br />
            Email: <a
              href="https://mail.google.com/mail/?view=cm&to=vijishvanya@gmail.com&su=Terms%20Condition%20Inquiry"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              terms@studentpath.com
            </a>
          </p>

          <h2 className="text-lg font-medium">17. Miscellaneous</h2>
          <p>
            These Terms constitute the entire agreement between you and StudentPath regarding the Platform and supersede
            any prior agreements. If any provision is found unenforceable, the remainder will remain in effect.
          </p>
        </section>

        <footer className="mt-8 text-sm text-gray-600">
          <p>© {new Date().getFullYear()} StudentPath. All rights reserved.</p>
        </footer>
      </main>
    </div>
  )
}
