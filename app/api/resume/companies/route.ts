/**
 * GET /api/resume/companies
 * Returns top 50+ companies for resume analysis. No DB auth needed for company list.
 * Auth: student OR professional.
 */

import { NextResponse } from "next/server";

const TOP_COMPANIES = [
  // FAANG+
  { id: "google",     name: "🌟 Google",       roles: ["SWE", "ML Engineer", "Data Analyst", "Product Manager"] },
  { id: "meta",       name: "🌟 Meta",          roles: ["SWE", "ML Engineer", "Data Scientist", "Product Manager"] },
  { id: "amazon",     name: "🌟 Amazon",        roles: ["SWE", "Data Engineer", "DevOps Engineer", "SDE-2"] },
  { id: "apple",      name: "🌟 Apple",         roles: ["SWE", "iOS Developer", "ML Engineer", "Hardware Engineer"] },
  { id: "netflix",    name: "🌟 Netflix",       roles: ["SWE", "Data Engineer", "ML Engineer"] },
  { id: "microsoft",  name: "🌟 Microsoft",     roles: ["SWE", "SDE", "PM", "Data Scientist"] },
  // Top Tech
  { id: "openai",     name: "⚡ OpenAI",        roles: ["Research Engineer", "SWE", "ML Engineer"] },
  { id: "nvidia",     name: "⚡ NVIDIA",        roles: ["CUDA Engineer", "ML Engineer", "SWE"] },
  { id: "uber",       name: "⚡ Uber",          roles: ["SWE", "Backend Engineer", "Data Scientist"] },
  { id: "airbnb",     name: "⚡ Airbnb",        roles: ["SWE", "Frontend Engineer", "Data Scientist"] },
  { id: "linkedin",   name: "⚡ LinkedIn",      roles: ["SWE", "ML Engineer", "Data Engineer"] },
  { id: "stripe",     name: "⚡ Stripe",        roles: ["SWE", "Backend Engineer", "Platform Engineer"] },
  { id: "figma",      name: "⚡ Figma",         roles: ["SWE", "Frontend Engineer", "Product Designer"] },
  { id: "databricks", name: "⚡ Databricks",    roles: ["Data Engineer", "ML Engineer", "SWE"] },
  { id: "snowflake",  name: "⚡ Snowflake",     roles: ["SWE", "Data Engineer", "Cloud Engineer"] },
  { id: "palantir",   name: "⚡ Palantir",      roles: ["SWE", "Data Engineer", "Forward Deployed Engineer"] },
  { id: "salesforce", name: "⚡ Salesforce",    roles: ["SWE", "SDE", "MTS", "Platform Engineer"] },
  { id: "adobe",      name: "⚡ Adobe",         roles: ["SWE", "ML Engineer", "Research Engineer"] },
  { id: "oracle",     name: "⚡ Oracle",        roles: ["SWE", "Application Developer", "Cloud Engineer"] },
  { id: "twilio",     name: "⚡ Twilio",        roles: ["SWE", "Backend Engineer", "Developer Advocate"] },
  // Indian MNCs & IT
  { id: "flipkart",   name: "🏢 Flipkart",      roles: ["SDE", "SDE-2", "Data Analyst", "Backend Engineer"] },
  { id: "swiggy",     name: "🏢 Swiggy",        roles: ["SDE", "Backend Engineer", "Data Engineer"] },
  { id: "zomato",     name: "🏢 Zomato",        roles: ["SDE", "Backend Engineer", "Data Analyst"] },
  { id: "ola",        name: "🏢 Ola",           roles: ["SDE", "SDE-2", "ML Engineer"] },
  { id: "cred",       name: "🏢 CRED",          roles: ["SDE", "Backend Engineer", "Data Engineer"] },
  { id: "razorpay",   name: "🏢 Razorpay",      roles: ["SDE", "SDE-2", "Platform Engineer"] },
  { id: "meesho",     name: "🏢 Meesho",        roles: ["SDE", "Data Engineer", "ML Engineer"] },
  { id: "paytm",      name: "🏢 Paytm",         roles: ["SDE", "Backend Engineer", "Data Analyst"] },
  { id: "byju",       name: "🏢 BYJU'S",        roles: ["SDE", "Data Engineer", "ML Engineer"] },
  { id: "info",       name: "🏢 Infosys",       roles: ["Developer", "SAP Consultant", "DevOps"] },
  { id: "tcs",        name: "🏢 TCS",           roles: ["Developer", "SAP Consultant", "Cloud Engineer"] },
  { id: "wipro",      name: "🏢 Wipro",         roles: ["Developer", "Cloud Engineer", "Data Analyst"] },
  { id: "hcl",        name: "🏢 HCL",           roles: ["Developer", "Cloud Engineer", "Desktop Engineer"] },
  { id: "cognizant",  name: "🏢 Cognizant",     roles: ["Developer", "Business Analyst", "Consultant"] },
  { id: "accenture",  name: "🏢 Accenture",     roles: ["Developer", "Consultant", "Data Scientist"] },
  { id: "capgemini",  name: "🏢 Capgemini",     roles: ["Developer", "Cloud Engineer", "SAP Consultant"] },
  { id: "mphasis",    name: "🏢 Mphasis",       roles: ["Developer", "DevOps", "Cloud Engineer"] },
  { id: "ltim",       name: "🏢 LTIMindtree",   roles: ["Developer", "Data Engineer", "Cloud Engineer"] },
  // Finance & BFSI
  { id: "goldman",    name: "💰 Goldman Sachs",  roles: ["Analyst", "SWE", "Quant Developer"] },
  { id: "jpmorgan",   name: "💰 JP Morgan",      roles: ["SWE", "Analyst", "Quant Developer"] },
  { id: "morgan",     name: "💰 Morgan Stanley", roles: ["SWE", "Analyst", "Data Scientist"] },
  { id: "blackrock",  name: "💰 BlackRock",      roles: ["SWE", "Data Scientist", "Quant Analyst"] },
  { id: "deloitte",   name: "💰 Deloitte",       roles: ["Analyst", "Consultant", "SWE"] },
  { id: "kpmg",       name: "💰 KPMG",           roles: ["Analyst", "Consultant", "Data Analyst"] },
  { id: "pwc",        name: "💰 PwC",            roles: ["Analyst", "Consultant", "Data Scientist"] },
  { id: "ey",         name: "💰 Ernst & Young",  roles: ["Analyst", "Consultant", "SWE"] },
  // Semiconductor
  { id: "intel",      name: "🔬 Intel",          roles: ["Hardware Engineer", "SWE", "ML Engineer"] },
  { id: "qualcomm",   name: "🔬 Qualcomm",       roles: ["SWE", "Embedded Engineer", "DSP Engineer"] },
  { id: "samsung",    name: "🔬 Samsung",        roles: ["SWE", "Embedded Engineer", "Research Engineer"] },
  { id: "amd",        name: "🔬 AMD",            roles: ["SWE", "Hardware Engineer", "GPU Engineer"] },
  { id: "arm",        name: "🔬 ARM",            roles: ["SWE", "Embedded Engineer", "IP Engineer"] },
];

export async function GET() {
  try {
    // Return top companies + all roles flat list
    const companies = TOP_COMPANIES.flatMap(c =>
      c.roles.map(role => ({
        company_id: c.id,
        company_name: c.name,
        role,
      }))
    );

    return NextResponse.json({
      success: true,
      data: {
        popular: TOP_COMPANIES.map(c => ({ id: c.id, name: c.name, roles: c.roles })),
        onCampus: [],
        offCampus: [],
      },
    });
  } catch (error) {
    console.error("[Resume Companies] Error:", error);
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}
