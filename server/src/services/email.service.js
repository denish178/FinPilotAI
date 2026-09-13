import nodemailer from "nodemailer";

export const isEmailConfigured = () => Boolean(process.env.SMTP_HOST?.trim());

const createTransporter = () => {
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure =
    process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1";

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
};

export const sendEmail = async ({ to, subject, text, html }) => {
  const from =
    process.env.EMAIL_FROM?.trim() || "FinPilot AI <noreply@localhost>";

  if (!isEmailConfigured()) {
    console.log("\n========== EMAIL (dev — SMTP not configured) ==========");
    console.log(`From: ${from}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text);
    console.log("=======================================================\n");
    return { mode: "console", to, subject };
  }

  const transporter = createTransporter();
  await transporter.sendMail({ from, to, subject, text, html });
  return { mode: "smtp", to, subject };
};
