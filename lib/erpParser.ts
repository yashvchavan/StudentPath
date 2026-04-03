import * as XLSX from 'xlsx';

export interface ErpStudentRow {
  prn: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  branch?: string;
  department?: string;
  year?: number;
  semester?: number;
  division?: string;
  roll_no?: string;
  gender?: string;
  date_of_birth?: string;
  address?: string;
  city?: string;
  state?: string;
  extra_data?: Record<string, any>;
}

const KNOWN_COLUMNS = new Set([
  'prn', 'first_name', 'last_name', 'full_name', 'email',
  'phone', 'branch', 'department', 'year', 'semester',
  'division', 'roll_no', 'gender', 'date_of_birth', 'address', 'city', 'state'
]);

export function parseErpExcel(buffer: Buffer): ErpStudentRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  console.log('[ERP Parser] Sheet Names:', workbook.SheetNames);

  let allRows: ErpStudentRow[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rawData.length === 0) {
      console.log(`[ERP Parser] Skipping empty sheet: ${sheetName}`);
      continue;
    }

    // Check headers for a PRN/Roll No/Email column — basic heuristic to detect student sheets
    const firstRow = rawData[0];
    const keys = Object.keys(firstRow).map(k => k.toLowerCase().trim());
    const hasPrn = keys.some(k =>
      k.includes('prn') || k.includes('roll') || k.includes('enrollment') ||
      k.includes('registration') || k.includes('student id') || k.includes('studentid')
    );
    const hasEmail = keys.some(k => k.includes('email') || k.includes('mail'));

    if (!hasPrn && !hasEmail) {
      console.log(`[ERP Parser] Skipping sheet '${sheetName}' — no PRN/Email column found`);
      continue;
    }

    console.log(`[ERP Parser] Parsing sheet: ${sheetName} (${rawData.length} rows)`);

    const sheetRows = rawData.map(row => extractStudentRow(row)).filter(Boolean) as ErpStudentRow[];
    console.log(`[ERP Parser] Extracted ${sheetRows.length} valid rows from ${sheetName}`);
    allRows = [...allRows, ...sheetRows];
  }

  console.log(`[ERP Parser] Total rows parsed: ${allRows.length}`);
  return allRows;
}

function extractStudentRow(row: Record<string, any>): ErpStudentRow | null {
  const get = (candidates: string[]): string => {
    for (const candidate of candidates) {
      const key = Object.keys(row).find(
        k => k.toLowerCase().trim() === candidate.toLowerCase()
      );
      if (key && row[key] !== undefined && row[key] !== '') {
        return String(row[key]).trim();
      }
    }
    // Fuzzy: partial match
    for (const candidate of candidates) {
      const key = Object.keys(row).find(
        k => k.toLowerCase().includes(candidate.toLowerCase())
      );
      if (key && row[key] !== undefined && row[key] !== '') {
        return String(row[key]).trim();
      }
    }
    return '';
  };

  // PRN is mandatory - try all common variants
  const prn = get([
    'prn', 'prn number', 'prn no', 'prn no.', 'prnno',
    'roll no', 'roll number', 'rollno', 'roll_no',
    'enrollment no', 'enrollment number', 'enroll no', 'enroll_no',
    'registration no', 'reg no', 'student id', 'studentid', 'id',
    'admission no', 'admission number', 'gr no', 'gr number'
  ]);

  if (!prn) return null;

  const firstName = get(['first name', 'firstname', 'first_name', 'fname']);
  const lastName = get(['last name', 'lastname', 'last_name', 'lname', 'surname']);
  const fullName = get(['full name', 'fullname', 'full_name', 'student name', 'name', 'student_name']) ||
    (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || '');

  const email = get([
    'email', 'email id', 'email_id', 'emailid', 'e-mail',
    'personal email', 'college email', 'institute email',
    'personal_email', 'student email', 'mail'
  ]);

  const phone = get([
    'phone', 'mobile', 'contact', 'phone no', 'mobile no',
    'contact no', 'phone number', 'mobile number', 'contact number',
    'phone_no', 'mobile_no', 'cell'
  ]);

  const branch = get([
    'branch', 'stream', 'course', 'programme', 'program',
    'branch name', 'course name', 'department', 'dept',
    'branch_name', 'dept_name'
  ]);

  const department = get([
    'department', 'dept', 'dept name', 'department name', 'dept_name'
  ]) || branch;

  const yearRaw = get([
    'year', 'current year', 'academic year', 'year of study',
    'year_of_study', 'class', 'sem year', 'class year'
  ]);
  const year = parseYear(yearRaw);

  const semRaw = get([
    'semester', 'sem', 'current semester', 'current sem', 'sem_no'
  ]);
  const semester = semRaw ? parseInt(semRaw) || undefined : undefined;

  const division = get(['division', 'div', 'section', 'batch']);

  const rollNo = get([
    'roll no', 'roll number', 'rollno', 'roll_no',
    'class roll no', 'dept roll no'
  ]);

  const gender = get(['gender', 'sex']);
  const dob = get(['date of birth', 'dob', 'birth date', 'date_of_birth', 'birthdate']);
  const address = get(['address', 'permanent address', 'current address', 'home address']);
  const city = get(['city', 'town', 'home city']);
  const state = get(['state', 'province', 'home state']);

  // Collect unknown columns into extra_data
  const mappedKeys = new Set([
    ...['prn', 'prnno', 'prn number', 'prn no', 'roll no', 'roll number', 'enrollment no',
        'enrollment number', 'registration no', 'student id', 'id'],
    ...['first name', 'firstname', 'fname', 'last name', 'lastname', 'lname', 'surname'],
    ...['full name', 'fullname', 'student name', 'name'],
    ...['email', 'email id', 'emailid', 'e-mail', 'mail'],
    ...['phone', 'mobile', 'contact', 'phone no', 'mobile no', 'cell'],
    ...['branch', 'stream', 'course', 'programme', 'program', 'department', 'dept'],
    ...['year', 'current year', 'class', 'sem year'],
    ...['semester', 'sem', 'current semester'],
    ...['division', 'div', 'section', 'batch'],
    ...['gender', 'sex'],
    ...['date of birth', 'dob', 'birth date', 'birthdate'],
    ...['address', 'city', 'state', 'province']
  ]);

  const extra_data: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    if (!mappedKeys.has(k.toLowerCase().trim()) && v !== '' && v !== null) {
      extra_data[k] = v;
    }
  }

  return {
    prn,
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    full_name: fullName || undefined,
    email: email || undefined,
    phone: phone || undefined,
    branch: branch || undefined,
    department: department || undefined,
    year: year || undefined,
    semester: semester || undefined,
    division: division || undefined,
    roll_no: rollNo || undefined,
    gender: gender || undefined,
    date_of_birth: dob ? parseDob(dob) : undefined,
    address: address || undefined,
    city: city || undefined,
    state: state || undefined,
    extra_data: Object.keys(extra_data).length > 0 ? extra_data : undefined,
  };
}

function parseYear(raw: string): number | undefined {
  if (!raw) return undefined;
  // Handle "1st", "2nd", "3rd", "4th" style
  const ordinalMap: Record<string, number> = {
    'first': 1, '1st': 1, 'second': 2, '2nd': 2,
    'third': 3, '3rd': 3, 'fourth': 4, '4th': 4,
    'fy': 1, 'sy': 2, 'ty': 3, 'ly': 4,
    'fe': 1, 'se': 2, 'te': 3,
  };
  const lower = raw.toLowerCase().trim();
  if (ordinalMap[lower]) return ordinalMap[lower];
  const num = parseInt(raw);
  if (!isNaN(num) && num >= 1 && num <= 4) return num;
  return undefined;
}

function parseDob(raw: string): string | undefined {
  if (!raw) return undefined;
  try {
    // Handle Excel serial date numbers
    if (typeof raw === 'number' || /^\d{5}$/.test(raw)) {
      const serialNum = typeof raw === 'number' ? raw : parseInt(raw);
      const date = new Date(Math.round((serialNum - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    }
    // Parse common date formats
    const parts = String(raw).trim().split(/[\/\-\.]/);
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        // dd/mm/yyyy
        const [d, m, y] = parts;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      } else if (parts[0].length === 4) {
        // yyyy-mm-dd
        return raw.trim();
      }
    }
    return raw.trim() || undefined;
  } catch {
    return undefined;
  }
}
