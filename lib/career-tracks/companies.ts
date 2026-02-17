/**
 * companies.ts — Static company data for Career Tracks feature.
 * 
 * ARCHITECTURE NOTE:
 * This file currently holds hardcoded company data for both on-campus and off-campus.
 * In production:
 *   - On-Campus data will be extracted from Excel sheets uploaded by college admins.
 *   - Off-Campus data will also be extracted from admin-uploaded documents/sheets.
 * The interfaces are designed to match the expected Excel column structure,
 * so swapping from static data to DB-fetched data only requires changing the data source
 * in the API route — the shape stays the same.
 */

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface InterviewRound {
    name: string;
    type: "Technical" | "HR" | "Aptitude" | "Coding" | "Group Discussion" | "Case Study";
}

export interface Company {
    id: string;
    name: string;
    logo: string;                  // Emoji for now; will be URL after admin upload
    requiredSkills: string[];
    interviewRounds: InterviewRound[];
    averagePackage: string;        // e.g. "₹6.5 LPA"
    roleType: string;              // e.g. "SDE", "Data Analyst"
    difficulty: "Easy" | "Medium" | "Hard";
    description: string;
    website: string;
    locations: string[];
}

export interface OnCampusProgram {
    id: string;
    companyName: string;
    logo: string;
    roleTitle: string;
    package: string;
    eligibilityCriteria: string;   // e.g. "CGPA >= 7.0, No active backlogs"
    requiredSkills: string[];
    driveDate: string;             // ISO date string
    registrationDeadline: string;  // ISO date string
    status: "Upcoming" | "Ongoing" | "Completed";
    rounds: InterviewRound[];
    selectedCount?: number;        // Students selected (filled after drive)
    totalApplicants?: number;
    academicYear?: string;         // e.g. "2025-26"
    // AI-extracted fields
    extracted_skills?: string[];
    extracted_rounds?: Array<{ name: string; type: string }>;
    difficulty_level?: "Easy" | "Medium" | "Hard";
    total_rounds?: number;
    ai_confidence_score?: number;
    last_ai_update?: Date | string;
}


// ─── Static On-Campus Data (will come from admin-uploaded Excel) ─────────────

export const onCampusPrograms: OnCampusProgram[] = [
    {
        id: "oc-1",
        companyName: "Tata Consultancy Services",
        logo: "🏢",
        roleTitle: "System Engineer",
        package: "₹3.6 LPA",
        eligibilityCriteria: "CGPA >= 6.0, No active backlogs",
        requiredSkills: ["Java", "SQL", "Problem Solving", "Communication"],
        driveDate: "2026-03-15",
        registrationDeadline: "2026-03-01",
        status: "Upcoming",
        rounds: [
            { name: "Aptitude Test", type: "Aptitude" },
            { name: "Coding Round", type: "Coding" },
            { name: "Technical Interview", type: "Technical" },
            { name: "HR Interview", type: "HR" },
        ],
        totalApplicants: 450,
    },
    {
        id: "oc-2",
        companyName: "Infosys",
        logo: "💼",
        roleTitle: "Systems Engineer",
        package: "₹3.8 LPA",
        eligibilityCriteria: "CGPA >= 6.0, All branches eligible",
        requiredSkills: ["Python", "Java", "DBMS", "Communication"],
        driveDate: "2026-03-22",
        registrationDeadline: "2026-03-10",
        status: "Upcoming",
        rounds: [
            { name: "Online Assessment", type: "Aptitude" },
            { name: "Coding Test", type: "Coding" },
            { name: "Technical + HR", type: "Technical" },
        ],
        totalApplicants: 380,
    },
    {
        id: "oc-3",
        companyName: "Wipro",
        logo: "🌐",
        roleTitle: "Project Engineer",
        package: "₹3.5 LPA",
        eligibilityCriteria: "CGPA >= 5.5, No active backlogs",
        requiredSkills: ["C/C++", "Java", "SQL", "Aptitude"],
        driveDate: "2026-02-28",
        registrationDeadline: "2026-02-20",
        status: "Ongoing",
        rounds: [
            { name: "Online Test", type: "Aptitude" },
            { name: "Coding Assessment", type: "Coding" },
            { name: "Interview", type: "Technical" },
        ],
        totalApplicants: 520,
    },
    {
        id: "oc-4",
        companyName: "Cognizant",
        logo: "⚡",
        roleTitle: "Programmer Analyst",
        package: "₹4.0 LPA",
        eligibilityCriteria: "CGPA >= 6.5, CS/IT branches",
        requiredSkills: ["Java", "Python", "Data Structures", "SQL"],
        driveDate: "2026-04-05",
        registrationDeadline: "2026-03-25",
        status: "Upcoming",
        rounds: [
            { name: "Aptitude + Coding", type: "Aptitude" },
            { name: "Technical Interview", type: "Technical" },
            { name: "HR Round", type: "HR" },
        ],
    },
];

// ─── Static Off-Campus Data (will come from admin-uploaded documents/sheets) ─

export const offCampusCompanies: Company[] = [
    {
        id: "comp-1",
        name: "Google",
        logo: "🔍",
        requiredSkills: ["Data Structures", "Algorithms", "System Design", "Python", "Problem Solving"],
        interviewRounds: [
            { name: "Online Assessment", type: "Coding" },
            { name: "Phone Screen", type: "Technical" },
            { name: "Onsite Round 1", type: "Coding" },
            { name: "Onsite Round 2", type: "Technical" },
            { name: "Behavioral", type: "HR" },
        ],
        averagePackage: "₹30+ LPA",
        roleType: "SDE",
        difficulty: "Hard",
        description: "One of the top tech companies globally. Known for challenging coding interviews focused on algorithms and system design.",
        website: "https://careers.google.com",
        locations: ["Bangalore", "Hyderabad", "Gurgaon"],
    },
    {
        id: "comp-2",
        name: "Microsoft",
        logo: "🪟",
        requiredSkills: ["Data Structures", "Algorithms", "C++", "System Design", "OOP"],
        interviewRounds: [
            { name: "Online Assessment", type: "Coding" },
            { name: "Technical Round 1", type: "Technical" },
            { name: "Technical Round 2", type: "Technical" },
            { name: "Hiring Manager", type: "HR" },
        ],
        averagePackage: "₹28+ LPA",
        roleType: "SDE",
        difficulty: "Hard",
        description: "Global technology leader. Interviews focus on DSA, system design, and cultural fit.",
        website: "https://careers.microsoft.com",
        locations: ["Hyderabad", "Bangalore", "Noida"],
    },
    {
        id: "comp-3",
        name: "Amazon",
        logo: "📦",
        requiredSkills: ["Data Structures", "Algorithms", "System Design", "Java", "Leadership Principles"],
        interviewRounds: [
            { name: "Online Assessment", type: "Coding" },
            { name: "Technical Round 1", type: "Coding" },
            { name: "Technical Round 2", type: "Technical" },
            { name: "Bar Raiser", type: "HR" },
        ],
        averagePackage: "₹26+ LPA",
        roleType: "SDE",
        difficulty: "Hard",
        description: "E-commerce and cloud giant. Strong focus on Leadership Principles alongside technical skills.",
        website: "https://amazon.jobs",
        locations: ["Hyderabad", "Bangalore", "Chennai"],
    },
    {
        id: "comp-4",
        name: "Flipkart",
        logo: "🛒",
        requiredSkills: ["Data Structures", "Algorithms", "Java", "System Design", "SQL"],
        interviewRounds: [
            { name: "Online Coding Test", type: "Coding" },
            { name: "Machine Coding", type: "Coding" },
            { name: "Problem Solving", type: "Technical" },
            { name: "Hiring Manager", type: "HR" },
        ],
        averagePackage: "₹22+ LPA",
        roleType: "SDE",
        difficulty: "Hard",
        description: "India's leading e-commerce platform. Focuses on coding, machine coding, and system design.",
        website: "https://www.flipkartcareers.com",
        locations: ["Bangalore"],
    },
    {
        id: "comp-5",
        name: "Deloitte",
        logo: "🔷",
        requiredSkills: ["SQL", "Python", "Excel", "Communication", "Business Analysis"],
        interviewRounds: [
            { name: "Aptitude Test", type: "Aptitude" },
            { name: "Group Discussion", type: "Group Discussion" },
            { name: "Technical Interview", type: "Technical" },
            { name: "HR Interview", type: "HR" },
        ],
        averagePackage: "₹8 LPA",
        roleType: "Analyst",
        difficulty: "Medium",
        description: "Big 4 consulting firm. Interviews include aptitude, GD, and technical skills.",
        website: "https://www2.deloitte.com/careers",
        locations: ["Mumbai", "Bangalore", "Hyderabad", "Pune"],
    },
    {
        id: "comp-6",
        name: "Accenture",
        logo: "🅰️",
        requiredSkills: ["Java", "Python", "SQL", "Communication", "Problem Solving"],
        interviewRounds: [
            { name: "Aptitude + Coding", type: "Aptitude" },
            { name: "Technical Interview", type: "Technical" },
            { name: "HR Round", type: "HR" },
        ],
        averagePackage: "₹4.5 LPA",
        roleType: "Associate Software Engineer",
        difficulty: "Easy",
        description: "Global IT services company. Relatively easier interviews focused on fundamentals.",
        website: "https://www.accenture.com/careers",
        locations: ["Pan India"],
    },
    {
        id: "comp-7",
        name: "Paytm",
        logo: "💰",
        requiredSkills: ["JavaScript", "React", "Node.js", "MongoDB", "REST APIs"],
        interviewRounds: [
            { name: "Online Test", type: "Coding" },
            { name: "Technical Round 1", type: "Technical" },
            { name: "Technical Round 2", type: "Technical" },
            { name: "HR Round", type: "HR" },
        ],
        averagePackage: "₹12 LPA",
        roleType: "SDE",
        difficulty: "Medium",
        description: "Leading fintech company. Focuses on web technologies and problem-solving skills.",
        website: "https://paytm.com/careers",
        locations: ["Noida", "Bangalore"],
    },
    {
        id: "comp-8",
        name: "Zoho",
        logo: "📊",
        requiredSkills: ["C/C++", "Data Structures", "Problem Solving", "Logic"],
        interviewRounds: [
            { name: "Aptitude Test", type: "Aptitude" },
            { name: "Programming Round", type: "Coding" },
            { name: "Advanced Programming", type: "Coding" },
            { name: "Technical + HR", type: "Technical" },
        ],
        averagePackage: "₹6.5 LPA",
        roleType: "Member Technical Staff",
        difficulty: "Medium",
        description: "Product-based company known for extensive programming rounds. Strong C/C++ focus.",
        website: "https://www.zoho.com/careers.html",
        locations: ["Chennai", "Tenkasi"],
    },
    {
        id: "comp-9",
        name: "Razorpay",
        logo: "💳",
        requiredSkills: ["Go", "Python", "Microservices", "System Design", "Distributed Systems"],
        interviewRounds: [
            { name: "Coding Challenge", type: "Coding" },
            { name: "System Design", type: "Technical" },
            { name: "Cultural Fit", type: "HR" },
        ],
        averagePackage: "₹18 LPA",
        roleType: "SDE",
        difficulty: "Hard",
        description: "Top fintech startup. Focus on backend engineering, distributed systems, and payments.",
        website: "https://razorpay.com/careers",
        locations: ["Bangalore"],
    },
    {
        id: "comp-10",
        name: "Capgemini",
        logo: "🔵",
        requiredSkills: ["Java", "SQL", "Communication", "Aptitude", "Team Work"],
        interviewRounds: [
            { name: "Online Assessment", type: "Aptitude" },
            { name: "Technical Interview", type: "Technical" },
            { name: "HR Interview", type: "HR" },
        ],
        averagePackage: "₹3.8 LPA",
        roleType: "Analyst",
        difficulty: "Easy",
        description: "Global IT services firm with a strong presence in India. Straightforward interview process.",
        website: "https://www.capgemini.com/careers",
        locations: ["Pan India"],
    },
];
