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

const normalizeHeader = (header) =>
  header.trim().toLowerCase().replace(/\s+/g, "");

const parseCsvLine = (line) => {
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

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
};

const parseDate = (value) => {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return parsed.toISOString();
};

const normalizeType = (value) => {
  const type = String(value || "").trim().toLowerCase();
  if (!["income", "expense"].includes(type)) {
    throw new Error(`Invalid type: ${value}. Use income or expense.`);
  }
  return type;
};

const normalizePaymentMethod = (value) => {
  const method = String(value || "upi")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  const allowed = [
    "cash",
    "upi",
    "credit_card",
    "debit_card",
    "bank_transfer",
    "wallet",
    "other",
  ];

  if (!allowed.includes(method)) {
    return "other";
  }
  return method;
};

export const parseTransactionsCsv = (fileContent) => {
  const lines = fileContent
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one data row");
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const required = CSV_HEADERS.map(normalizeHeader);
  const missing = required.filter((key) => !headers.includes(key));

  if (missing.length > 0) {
    throw new Error(
      `Missing required columns: ${missing.join(", ")}. Expected: ${CSV_HEADERS.join(", ")}`,
    );
  }

  const transactions = [];
  const errors = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });

    try {
      const amount = Number(row.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Amount must be a positive number");
      }

      const category = String(row.category || "").trim();
      if (!category) {
        throw new Error("Category is required");
      }

      transactions.push({
        type: normalizeType(row.type),
        amount,
        category,
        description: String(row.description || "").trim(),
        date: parseDate(row.date),
        paymentMethod: normalizePaymentMethod(
          row.paymentmethod ?? row.paymentMethod,
        ),
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
