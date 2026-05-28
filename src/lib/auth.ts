import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { additionalUserFields } from "./auth-shared";
import { sendEmail } from "./email";

type AuthEnv = {
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
};

function buildOptions(env: AuthEnv) {
  const googleEnabled = Boolean(
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
  );

  return {
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({
        user,
        url,
      }: {
        user: { email: string };
        url: string;
      }) => {
        await sendEmail(
          {
            to: user.email,
            subject: "FUJISAN — メールアドレスの確認 / Verify your email",
            text: `FUJISAN SAKE\n\n以下のリンクからメールアドレスを確認してください。\nPlease verify your email address:\n\n${url}\n`,
          },
          { apiKey: env.RESEND_API_KEY, from: env.RESEND_FROM },
        );
      },
    },
    user: {
      additionalFields: additionalUserFields,
    },
    ...(googleEnabled
      ? {
          socialProviders: {
            google: {
              clientId: env.GOOGLE_CLIENT_ID as string,
              clientSecret: env.GOOGLE_CLIENT_SECRET as string,
            },
          },
        }
      : {}),
  };
}

async function authBuilder() {
  // 実行時だけ評価する。これらの import を静的にすると CLI (`generate`) が
  // Cloudflare コンテキスト無しで落ちるため、動的 import に閉じ込める。
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { getDb } = await import("@/db");
  const { env } = await getCloudflareContext({ async: true });
  const db = await getDb();

  return betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite" }),
    ...buildOptions(env as AuthEnv),
  });
}

let instance: Awaited<ReturnType<typeof authBuilder>> | null = null;

/** リクエスト処理・セッション取得で使う実行時の auth インスタンス（worker 生存中はキャッシュ）。 */
export async function getAuth() {
  if (!instance) {
    instance = await authBuilder();
  }
  return instance;
}

/** Google ログインが設定済みか（ログイン画面のボタン表示判定用）。 */
export async function isGoogleEnabled() {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext({ async: true });
  const e = env as AuthEnv;
  return Boolean(e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET);
}

/**
 * Better Auth CLI (`generate`) 専用の静的インスタンス。プレーン Node で動き
 * Cloudflare コンテキストを持たないため、設定の形だけを CLI に渡す。
 */
export const auth = betterAuth({
  database: drizzleAdapter({} as never, { provider: "sqlite" }),
  ...buildOptions({}),
});
