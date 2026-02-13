/**
 * exams.ts — Static competitive exam data for Career Tracks feature.
 *
 * ARCHITECTURE NOTE:
 * This file currently holds hardcoded exam data for GATE, CAT, CET, GRE.
 * In production, this data will be extracted from admin-uploaded documents/sheets.
 * The interfaces are designed to match expected document fields, so swapping
 * to DB-fetched data only requires changing the data source in the API route.
 */

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface SyllabusTopic {
    id: string;
    name: string;
    weight: number;         // Percentage of total marks
    subtopics: string[];
}

export interface Exam {
    id: string;
    name: string;
    fullName: string;
    icon: string;            // Emoji for now
    description: string;
    eligibility: string[];
    syllabusTopics: SyllabusTopic[];
    examDate: string;        // Approximate exam period
    registrationDeadline: string;
    examDuration: string;    // e.g., "3 hours"
    totalMarks: number;
    passingCriteria: string;
    officialWebsite: string;
    category: "Engineering" | "Management" | "General";
}

// ─── Static Exam Data (will come from admin-uploaded documents/sheets) ───────

export const competitiveExams: Exam[] = [
    {
        id: "gate",
        name: "GATE",
        fullName: "Graduate Aptitude Test in Engineering",
        icon: "🎓",
        description: "National-level exam for admission to M.Tech/M.E. programs in IITs, NITs, and other top institutes. Also used for PSU recruitment.",
        eligibility: [
            "Bachelor's degree in Engineering/Technology (4 years)",
            "Master's degree in any branch of Science/Mathematics/Statistics/Computer Applications",
            "Students in final year of qualifying degree can also apply",
            "No age limit",
        ],
        syllabusTopics: [
            {
                id: "gate-1",
                name: "Engineering Mathematics",
                weight: 15,
                subtopics: ["Linear Algebra", "Calculus", "Differential Equations", "Probability & Statistics", "Numerical Methods"],
            },
            {
                id: "gate-2",
                name: "Digital Logic",
                weight: 8,
                subtopics: ["Boolean Algebra", "Combinational Circuits", "Sequential Circuits", "Number Representations"],
            },
            {
                id: "gate-3",
                name: "Computer Organization",
                weight: 8,
                subtopics: ["Machine Instructions", "Addressing Modes", "ALU", "CPU Design", "Memory Hierarchy", "I/O Interface"],
            },
            {
                id: "gate-4",
                name: "Programming & Data Structures",
                weight: 15,
                subtopics: ["C Programming", "Recursion", "Arrays", "Stacks", "Queues", "Linked Lists", "Trees", "Graphs", "Hashing"],
            },
            {
                id: "gate-5",
                name: "Algorithms",
                weight: 10,
                subtopics: ["Searching", "Sorting", "Graph Algorithms", "Dynamic Programming", "Greedy", "Asymptotic Analysis"],
            },
            {
                id: "gate-6",
                name: "Theory of Computation",
                weight: 8,
                subtopics: ["Regular Languages", "Context-Free Languages", "Turing Machines", "Undecidability"],
            },
            {
                id: "gate-7",
                name: "Compiler Design",
                weight: 6,
                subtopics: ["Lexical Analysis", "Parsing", "Syntax-Directed Translation", "Code Generation"],
            },
            {
                id: "gate-8",
                name: "Operating Systems",
                weight: 10,
                subtopics: ["Processes", "Threading", "Scheduling", "Synchronization", "Memory Management", "File Systems"],
            },
            {
                id: "gate-9",
                name: "Databases",
                weight: 10,
                subtopics: ["ER Model", "Relational Model", "SQL", "Normalization", "Transactions", "Indexing"],
            },
            {
                id: "gate-10",
                name: "Computer Networks",
                weight: 10,
                subtopics: ["OSI Model", "TCP/IP", "Network Security", "Application Layer Protocols"],
            },
        ],
        examDate: "February 2027",
        registrationDeadline: "October 2026",
        examDuration: "3 hours",
        totalMarks: 100,
        passingCriteria: "Qualifying marks vary by category (General: ~25, OBC: ~22.5, SC/ST: ~16.6)",
        officialWebsite: "https://gate.iitb.ac.in",
        category: "Engineering",
    },
    {
        id: "cat",
        name: "CAT",
        fullName: "Common Admission Test",
        icon: "📈",
        description: "National-level entrance exam for MBA admission to IIMs and other top B-schools in India.",
        eligibility: [
            "Bachelor's degree with at least 50% marks (45% for SC/ST/PWD)",
            "Final year students in qualifying degree can apply",
            "No age limit",
            "Degree in any discipline accepted",
        ],
        syllabusTopics: [
            {
                id: "cat-1",
                name: "Verbal Ability & Reading Comprehension",
                weight: 34,
                subtopics: ["Reading Comprehension", "Para Jumbles", "Para Summary", "Sentence Completion", "Odd One Out"],
            },
            {
                id: "cat-2",
                name: "Data Interpretation & Logical Reasoning",
                weight: 32,
                subtopics: ["Data Tables", "Graphs & Charts", "Caselets", "Puzzles", "Arrangements", "Logical Connectives"],
            },
            {
                id: "cat-3",
                name: "Quantitative Aptitude",
                weight: 34,
                subtopics: ["Number Systems", "Algebra", "Geometry", "Mensuration", "Probability", "Permutation & Combination", "Time & Work"],
            },
        ],
        examDate: "November 2026",
        registrationDeadline: "September 2026",
        examDuration: "2 hours",
        totalMarks: 198,
        passingCriteria: "Percentile-based selection. 99+ percentile for top IIMs.",
        officialWebsite: "https://iimcat.ac.in",
        category: "Management",
    },
    {
        id: "cet",
        name: "MHT CET",
        fullName: "Maharashtra Common Entrance Test",
        icon: "📝",
        description: "State-level entrance exam for admission to engineering, pharmacy, and other professional courses in Maharashtra.",
        eligibility: [
            "Passed HSC (12th) or equivalent with Physics, Chemistry, and Mathematics",
            "Indian national",
            "No age limit for Engineering",
            "Maharashtra domicile preferred for state quota seats",
        ],
        syllabusTopics: [
            {
                id: "cet-1",
                name: "Mathematics",
                weight: 50,
                subtopics: ["Trigonometry", "Algebra", "Calculus", "Coordinate Geometry", "Statistics", "Probability"],
            },
            {
                id: "cet-2",
                name: "Physics",
                weight: 25,
                subtopics: ["Mechanics", "Thermodynamics", "Electrostatics", "Magnetism", "Optics", "Modern Physics"],
            },
            {
                id: "cet-3",
                name: "Chemistry",
                weight: 25,
                subtopics: ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Environmental Chemistry"],
            },
        ],
        examDate: "May 2026",
        registrationDeadline: "March 2026",
        examDuration: "3 hours",
        totalMarks: 200,
        passingCriteria: "Merit-based rank list. Higher percentile needed for top colleges.",
        officialWebsite: "https://cetcell.mahacet.org",
        category: "Engineering",
    },
    {
        id: "gre",
        name: "GRE",
        fullName: "Graduate Record Examinations",
        icon: "🌍",
        description: "Standardized test for admission to graduate schools worldwide. Accepted by thousands of universities globally.",
        eligibility: [
            "No specific eligibility criteria",
            "Available to anyone planning to attend graduate school",
            "Typically required for MS programs abroad (especially US, Canada, UK)",
            "Valid for 5 years from test date",
        ],
        syllabusTopics: [
            {
                id: "gre-1",
                name: "Verbal Reasoning",
                weight: 33,
                subtopics: ["Reading Comprehension", "Text Completion", "Sentence Equivalence", "Vocabulary in Context"],
            },
            {
                id: "gre-2",
                name: "Quantitative Reasoning",
                weight: 34,
                subtopics: ["Arithmetic", "Algebra", "Geometry", "Data Analysis", "Word Problems"],
            },
            {
                id: "gre-3",
                name: "Analytical Writing",
                weight: 33,
                subtopics: ["Analyze an Issue", "Analyze an Argument", "Essay Structure", "Critical Thinking"],
            },
        ],
        examDate: "Year-round (computer-based)",
        registrationDeadline: "Register at least 4 weeks before preferred date",
        examDuration: "3 hours 45 minutes",
        totalMarks: 340,
        passingCriteria: "No pass/fail. Score range: 260-340. Target 320+ for top universities.",
        officialWebsite: "https://www.ets.org/gre",
        category: "General",
    },
];
