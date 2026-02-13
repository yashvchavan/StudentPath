import * as XLSX from 'xlsx';

export interface PlacementRow {
    company_name: string;
    package: string;
    eligibility: string; // Branch
    drive_date?: string; // Interview Date
    remarks?: string;
    location?: string;
    students_registered?: number;
    students_selected?: number;
    role?: string;
    deadline?: string;
    apply_link?: string;
    academic_year?: string; // New field
}

export function parsePlacementExcel(buffer: Buffer): PlacementRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    console.log("[Parser] Sheet Names:", workbook.SheetNames);

    let allParsedRows: PlacementRow[] = [];

    // Iterate over ALL sheets
    for (const sheetName of workbook.SheetNames) {
        // Check if sheet represents a year range (e.g., 2024-25, 2023-24) or contains "Placement"
        // Or just try to parse all sheets that have data headers?
        // Since user said "sheets 2025-26, 2024-25...", let's try to grab all non-empty sheets that imply data.

        const sheet = workbook.Sheets[sheetName];
        const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (rawData.length === 0) {
            console.log(`[Parser] Skipping empty sheet: ${sheetName}`);
            continue;
        }

        // Check for headers
        const firstRow = rawData[0];
        const keys = Object.keys(firstRow).map(k => k.toLowerCase());
        const hasCompany = keys.some(k => k.includes('company') || k.includes('name'));

        if (!hasCompany) {
            console.log(`[Parser] Skipping sheet '${sheetName}' - no company header found.`);
            continue;
        }

        console.log(`[Parser] Parsing sheet: ${sheetName} with ${rawData.length} rows`);

        const sheetRows = rawData.map((row, index) => {
            const getValue = (keys: string[]) => {
                for (const key of keys) {
                    const foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === key.toLowerCase());
                    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== "") return row[foundKey];
                }
                return null;
            };

            const companyName = getValue(["Company Name", "Company", "Name of Company", "Organization", "Employer"]);

            if (!companyName) return null;

            const driveDateRaw = getValue(["Interview Date", "Date", "Drive Date"]);
            const driveDate = parseDate(driveDateRaw);

            const registered = getValue(["No. of Students Registred", "Students Registered", "Registered", "Total Students"]);
            const selected = getValue(["No of Students Selected", "Selected", "Placed", "Selects", "No of Students Selected for HR Interview"]);

            return {
                company_name: String(companyName).trim(),
                package: String(getValue(["Package", "CTC", "Salary", "Stipend"]) || ""),
                eligibility: String(getValue(["Branch", "Streams", "Eligibility", "Criteria"]) || ""),
                drive_date: driveDate,
                remarks: String(getValue(["Remark", "Remarks", "Comments", "Status"]) || ""),
                students_registered: registered ? parseInt(registered) || 0 : 0,
                students_selected: selected ? parseInt(selected) || 0 : 0,
                location: String(getValue(["Location", "City", "Place"]) || ""),
                role: String(getValue(["Role", "Job Profile", "Position", "Designation"]) || ""),
                academic_year: sheetName // Use sheet name as year
            };
        }).filter(Boolean) as PlacementRow[];

        console.log(`[Parser] Extracted ${sheetRows.length} rows from ${sheetName}`);
        allParsedRows = [...allParsedRows, ...sheetRows];
    }

    console.log(`[Parser] Total parsed rows across all sheets: ${allParsedRows.length}`);
    return allParsedRows;
}

function parseDate(dateVal: any): string | undefined {
    if (!dateVal) return undefined;
    if (typeof dateVal === 'number') {
        const date = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0];
    }
    if (typeof dateVal === 'string') {
        const parts = dateVal.trim().split(/[\/-]/);
        if (parts.length === 3) {
            if (parts[0].length === 4) return dateVal.trim();
            try {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                return `${year}-${month}-${day}`;
            } catch (e) { }
        }
    }
    return undefined;
}
