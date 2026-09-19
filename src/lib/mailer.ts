import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  if (!resend) {
    // No email provider configured yet — log so the flow is still usable in dev.
    console.log(`[DKU Life] Verification link for ${to}: ${verifyUrl}`);
    return;
  }

  await resend.emails.send({
    from: "DKU Life <onboarding@dkulife.app>",
    to,
    subject: "Verify your DKU Life account",
    html: `<p>Welcome to DKU Life! Click below to verify your account:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
}
