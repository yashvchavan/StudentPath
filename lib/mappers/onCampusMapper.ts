export function mapOnCampusRow(row: any) {
  const now = new Date();
  const driveDate = row.drive_date ? new Date(row.drive_date) : null;

  let status: "Upcoming" | "Ongoing" | "Completed" = "Upcoming";
  if (driveDate) {
    if (driveDate < now) status = "Completed";
    else status = "Upcoming";
  }

  return {
    id: String(row.id),
    companyName: row.company_name,
    roleTitle: row.role || "Not Specified",
    package: row.package_lpa || "—",
    driveDate: driveDate?.toISOString() ?? "",
    registrationDeadline: driveDate?.toISOString() ?? "",
    eligibilityCriteria: row.eligibility || "As per company criteria",
    requiredSkills: row.eligibility
      ? row.eligibility.split(",").map((s: string) => s.trim())
      : [],
    rounds: row.rounds
      ? row.rounds.split(",").map((r: string) => ({ name: r.trim() }))
      : [],
    status,
    logo: "🏢", // placeholder (later: company logos table)
    totalApplicants: null,
  };
}
