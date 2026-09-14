import { CSV_HEADERS } from "../constants/transactions";

const escapeCsvCell = (value) => {
  const str = value == null ? "" : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const transactionsToCsv = (rows) => {
  const header = CSV_HEADERS.join(",");
  const lines = rows.map((row) =>
    CSV_HEADERS.map((key) => escapeCsvCell(row[key])).join(","),
  );
  return [header, ...lines].join("\n");
};

export const downloadCsv = (filename, csvContent) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const sanitizeCsvText = (fileContent) => {
  let text = fileContent.replace(/^\uFEFF/, "");
  if (text.includes("\u0000")) {
    text = text.replace(/\u0000/g, "");
  }
  return text;
};

const normalizeHeader = (header) =>
  String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_\-./]+/g, "");

/** Each alias maps to exactly one canonical field (no shared aliases). */
const HEADER_ALIASES = {
  type: ["type", "transactiontype", "txntype", "incomeexpense", "drcrexpense"],
  amount: ["amount", "transactionamount", "amt", "value", "sum"],
  debit: ["debit", "dr", "withdrawal", "withdrawalamount", "moneyout", "paidout"],
  credit: ["credit", "cr", "deposit", "depositamount", "moneyin", "paidin"],
  category: ["category", "cat", "tag", "budgetcategory"],
  description: [
    "description",
    "desc",
    "note",
    "notes",
    "memo",
    "narration",
    "particulars",
    "details",
    "remark",
    "remarks",
  ],
  date: [
    "date",
    "transactiondate",
    "txndate",
    "datetime",
    "valuedate",
    "postingdate",
    "bookdate",
  ],
  paymentmethod: [
    "paymentmethod",
    "payment",
    "method",
    "mode",
    "paymentmode",
    "channel",
  ],
};

const ALIAS_TO_CANONICAL = new Map();
for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
  for (const alias of aliases) {
    ALIAS_TO_CANONICAL.set(alias, canonical);
  }
}

const toCanonicalHeader = (normalized) => {
  if (!normalized) return "";
  return ALIAS_TO_CANONICAL.get(normalized) || normalized;
};

const detectDelimiter = (line) => {
  const tabs = (line.match(/\t/g) || []).length;
  const semicolons = (line.match(/;/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  if (tabs >= semicolons && tabs >= commas && tabs > 0) return "\t";
  if (semicolons > commas) return ";";
  if (commas > 0) return ",";
  return semicolons > 0 ? ";" : ",";
};

const parseCsvLine = (line, delimiter = ",") => {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
};

const scoreHeaderRow = (cells) => {
  const canonical = cells.map((c) => toCanonicalHeader(normalizeHeader(c)));
  let score = 0;
  if (canonical.includes("date")) score += 3;
  if (canonical.includes("amount") || canonical.includes("debit") || canonical.includes("credit")) {
    score += 3;
  }
  if (canonical.includes("type") || canonical.includes("description")) score += 1;
  if (canonical.includes("category")) score += 1;
  return score;
};

const findHeaderRowIndex = (lines) => {
  const limit = Math.min(lines.length, 20);
  let bestIndex = 0;
  let bestScore = -1;

  for (let i = 0; i < limit; i += 1) {
    const delimiter = detectDelimiter(lines[i]);
    const cells = parseCsvLine(lines[i], delimiter);
    const score = scoreHeaderRow(cells);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestScore >= 3 ? bestIndex : 0;
};

const hasRequiredColumns = (headers) => {
  const hasDate = headers.includes("date");
  const hasAmount =
    headers.includes("amount") ||
    headers.includes("debit") ||
    headers.includes("credit");
  return hasDate && hasAmount;
};

const parseAmount = (value) => {
  const { amount } = parseAmountField(value);
  return amount;
};

/** Parse amount; negative / (parentheses) → expense, positive → infer from text or default expense. */
const parseAmountField = (value, description = "") => {
  let raw = String(value ?? "")
    .replace(/\u00a0/g, " ")
    .trim();

  const parenNegative = /^\((.*)\)$/.test(raw);
  if (parenNegative) {
    raw = raw.replace(/^\(|\)$/g, "").trim();
  }

  const cleaned = raw
    .replace(/[₹$€£]/g, "")
    .replace(/\s/g, "")
    .replace(/,/g, "");

  if (!cleaned || cleaned === "-" || cleaned === "--") {
    throw new Error("Amount is empty");
  }

  let num = Number(cleaned);
  if (parenNegative && num > 0) num = -num;

  if (!Number.isFinite(num) || num === 0) {
    throw new Error("Amount must be non-zero");
  }

  if (num < 0) {
    return { type: "expense", amount: Math.abs(num) };
  }

  const text = String(description || "").toLowerCase();
  const incomeHint =
    /salary|payroll|credited|credit|deposit|refund|interest earned|income|freelance/.test(
      text,
    );
  const type = incomeHint ? "income" : "expense";
  return { type, amount: num };
};

const tryParseAmount = (value) => {
  try {
    return parseAmount(value);
  } catch {
    return null;
  }
};

const parseDate = (value) => {
  if (!value) throw new Error("Date is required");

  const trimmed = String(value).trim();

  const isoDate = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) {
    const d = new Date(`${isoDate[1]}-${isoDate[2]}-${isoDate[3]}T12:00:00.000Z`);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  const dmy = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]) - 1;
    const year = Number(dmy[3]);
    const d = new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${value}. Use YYYY-MM-DD or DD/MM/YYYY`);
  }
  return parsed.toISOString();
};

const normalizeType = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (["income", "credit", "cr", "salary", "deposit"].includes(raw)) return "income";
  if (["expense", "debit", "dr", "spend", "withdrawal"].includes(raw)) return "expense";
  throw new Error(`Invalid type: ${value}. Use income or expense`);
};

const normalizePaymentMethod = (value) => {
  const method = String(value || "upi")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const allowed = [
    "cash",
    "upi",
    "credit_card",
    "debit_card",
    "bank_transfer",
    "wallet",
    "other",
  ];

  if (method === "card") return "other";
  if (method === "creditcard") return "credit_card";
  if (method === "debitcard") return "debit_card";
  if (method === "banktransfer") return "bank_transfer";

  if (!allowed.includes(method)) {
    return "other";
  }
  return method;
};

const inferCategory = (description, type) => {
  const text = String(description || "").toLowerCase();
  if (type === "income") {
    if (/salary|payroll|ctc/.test(text)) return "Salary";
    if (/freelance|contract|consult/.test(text)) return "Freelance";
    if (/rental|rent received/.test(text)) return "Rental Income";
    if (/dividend|interest|mutual fund|stock|mf /.test(text)) return "Investment Returns";
    if (/refund|cashback|reversal/.test(text)) return "Refunds & Cashback";
    if (/gift/.test(text)) return "Gift Received";
    return "Other";
  }

  if (/grocery|bigbasket|blinkit|zepto|dmart|supermarket/.test(text)) return "Groceries";
  if (/swiggy|zomato|restaurant|cafe|food|dining|dominos|mcd/.test(text)) {
    return "Food & Dining";
  }
  if (/uber|ola|rapido|metro|bus|train|cab|auto/.test(text)) return "Transport";
  if (/petrol|diesel|fuel|hpcl|iocl|bpcl|gas station/.test(text)) return "Fuel";
  if (/amazon|flipkart|myntra|shopping|mall|clothes|electronics/.test(text)) {
    return "Shopping";
  }
  if (/electric|water|gas bill|internet|broadband|jio|airtel|vi |mobile recharge|dth/.test(text)) {
    return "Bills & Utilities";
  }
  if (/rent|lease|housing society|maintenance/.test(text)) return "Rent";
  if (/emi|loan|hdfc loan|sbi loan|credit card bill|nbfc/.test(text)) return "EMI & Loans";
  if (/insurance|lic|premium|policy/.test(text)) return "Insurance";
  if (/hospital|pharmacy|medical|doctor|clinic|1mg|apollo/.test(text)) return "Healthcare";
  if (/school|college|course|udemy|coursera|tuition/.test(text)) return "Education";
  if (/netflix|spotify|movie|cinema|game|pub/.test(text)) return "Entertainment";
  if (/subscription|youtube premium|chatgpt|saas|membership/.test(text)) return "Subscriptions";
  if (/salon|gym|beauty|grooming/.test(text)) return "Personal Care";
  if (/flight|hotel|makemytrip|goibibo|irctc|travel/.test(text)) return "Travel";
  if (/donation|charity|temple|church|mosque/.test(text)) return "Gifts & Charity";
  if (/gst|tax|fee|penalty|challan/.test(text)) return "Taxes & Fees";
  return "Other";
};

const resolveTypeAndAmount = (row) => {
  const typeStr = String(row.type || "").trim();
  const description = String(row.description || "").trim();

  if (row.amount && typeStr) {
    return { type: normalizeType(typeStr), amount: parseAmount(row.amount) };
  }

  const debit = tryParseAmount(row.debit);
  const credit = tryParseAmount(row.credit);

  if (debit && credit) {
    throw new Error("Row has both debit and credit amounts; keep only one");
  }
  if (debit) {
    return { type: typeStr ? normalizeType(typeStr) : "expense", amount: debit };
  }
  if (credit) {
    return { type: typeStr ? normalizeType(typeStr) : "income", amount: credit };
  }

  if (row.amount) {
    return parseAmountField(row.amount, description);
  }

  throw new Error("No amount found (need amount, debit, or credit column)");
};

export const parseTransactionsCsv = (fileContent) => {
  const normalizedContent = sanitizeCsvText(fileContent);
  const rawLines = normalizedContent.split(/\r?\n/).map((line) => line.trim());
  const lines = rawLines.filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one data row");
  }

  const headerRowIndex = findHeaderRowIndex(lines);
  const headerLine = lines[headerRowIndex];
  const delimiter = detectDelimiter(headerLine);
  const rawHeaders = parseCsvLine(headerLine, delimiter);
  const headers = rawHeaders.map((cell) => toCanonicalHeader(normalizeHeader(cell)));

  if (!hasRequiredColumns(headers)) {
    throw new Error(
      `Could not read required columns (date + amount). Found: ${rawHeaders.join(" | ")}. Use FinPilot Export CSV, or columns like: Date, Debit/Credit (or Amount), Description. Category optional (defaults to Other).`,
    );
  }

  const transactions = [];
  const errors = [];

  for (let i = headerRowIndex + 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i], delimiter);
    const row = {};

    headers.forEach((header, index) => {
      if (!header) return;
      const value = cells[index] ?? "";
      if (value !== "" || row[header] === undefined) {
        row[header] = value;
      }
    });

    try {
      if (!String(row.date || "").trim()) {
        continue;
      }

      const { type, amount } = resolveTypeAndAmount(row);
      const description = String(row.description || "").trim();
      const category =
        String(row.category || "").trim() || inferCategory(description, type);

      transactions.push({
        type,
        amount,
        category,
        description,
        date: parseDate(row.date),
        paymentMethod: normalizePaymentMethod(row.paymentmethod),
      });
    } catch (error) {
      errors.push({ row: i + 1, message: error.message });
    }
  }

  if (transactions.length === 0) {
    throw new Error(
      errors.length
        ? `No valid rows found. First error (row ${errors[0].row}): ${errors[0].message}`
        : "No valid rows found in CSV",
    );
  }

  return { transactions, errors };
};
