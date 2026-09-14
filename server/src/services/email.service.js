import nodemailer from "nodemailer";

const truthy = (value) => value === "true" || value === "1" || value === "yes";

export const isEmailConfigured = () => Boolean(process.env.SMTP_HOST?.trim());

const smtpAuthRequired = () => !truthy(process.env.SMTP_AUTH_OPTIONAL);

const getFromAddress = () =>
  process.env.EMAIL_FROM?.trim() || "FinPilot AI <noreply@localhost>";

const getSmtpAuth = () => {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  if (user && pass) {
    return { user, pass };
  }
  return null;
};

export const createMailTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  const auth = getSmtpAuth();
  if (smtpAuthRequired() && !auth) {
    throw new Error(
      "SMTP_HOST is set but SMTP_USER and SMTP_PASS are missing. Set both or SMTP_AUTH_OPTIONAL=true for local relay (e.g. Mailpit).",
    );
  }

  const service = process.env.SMTP_SERVICE?.trim();
  if (service) {
    if (!auth) {
      throw new Error("SMTP_SERVICE requires SMTP_USER and SMTP_PASS");
    }
    return nodemailer.createTransport({
      service,
      auth,
    });
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = truthy(process.env.SMTP_SECURE);

  const transport = {
    host: process.env.SMTP_HOST.trim(),
    port,
    secure,
    auth: auth || undefined,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
  };

  if (!secure && port === 587) {
    transport.requireTLS = !truthy(process.env.SMTP_TLS_OPTIONAL);
  }

  if (truthy(process.env.SMTP_TLS_INSECURE)) {
    transport.tls = { rejectUnauthorized: false };
  }

  return nodemailer.createTransport(transport);
};

let cachedTransporter = null;

const getTransporter = () => {
  if (!cachedTransporter) {
    cachedTransporter = createMailTransporter();
  }
  return cachedTransporter;
};

export const getEmailDeliveryMode = () =>
  isEmailConfigured() ? "smtp" : "console";

/** Call once at startup to surface bad SMTP credentials early. */
export const verifyEmailTransport = async () => {
  if (!isEmailConfigured()) {
    return { ok: true, mode: "console" };
  }

  try {
    const transporter = getTransporter();
    if (!transporter) {
      return { ok: false, mode: "smtp", error: "Transporter could not be created" };
    }
    await transporter.verify();
    return { ok: true, mode: "smtp" };
  } catch (error) {
    cachedTransporter = null;
    return {
      ok: false,
      mode: "smtp",
      error: error.message || String(error),
    };
  }
};

const logConsoleEmail = ({ from, to, subject, text }) => {
  console.log("\n========== EMAIL (dev — SMTP not configured) ==========");
  console.log(`From: ${from}`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(text);
  console.log("=======================================================\n");
};

export const sendEmail = async ({ to, subject, text, html }) => {
  const from = getFromAddress();

  if (!isEmailConfigured()) {
    logConsoleEmail({ from, to, subject, text });
    return { mode: "console", to, subject };
  }

  try {
    const transporter = getTransporter();
    if (!transporter) {
      throw new Error("SMTP transporter is not available");
    }

    const info = await transporter.sendMail({ from, to, subject, text, html });
    return { mode: "smtp", to, subject, messageId: info.messageId };
  } catch (error) {
    cachedTransporter = null;
    console.error("[email] Failed to send:", error.message || error);
    throw error;
  }
};
