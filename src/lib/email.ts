type EmailArgs = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type EmailOpts = {
  apiKey?: string;
  from?: string;
};

/**
 * メール送信。RESEND_API_KEY があれば Resend で送信、なければ開発用に
 * コンソールへ出力する（ローカルでメール認証リンクをクリックできるように）。
 */
export async function sendEmail(args: EmailArgs, opts: EmailOpts): Promise<void> {
  if (!opts.apiKey) {
    console.log(
      `\n[email:dev] RESEND_API_KEY 未設定のためコンソール出力\n  to: ${args.to}\n  subject: ${args.subject}\n  ${args.text}\n`,
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: opts.from || "FUJISAN SAKE <onboarding@resend.dev>",
      to: args.to,
      subject: args.subject,
      text: args.text,
      ...(args.html ? { html: args.html } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend send failed: ${res.status} ${await res.text()}`);
  }
}
