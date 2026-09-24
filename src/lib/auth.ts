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

/**
 * 実行時インスタンスと CLI 用インスタンスで共有する設定。
 * レート制限の設定が実際に効くかを確かめる検証スクリプトからも読むため export する。
 */
export function buildAuthOptions(env: AuthEnv) {
  const googleEnabled = Boolean(
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
  );

  return {
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({
        user,
        url,
      }: {
        user: { email: string };
        url: string;
      }) => {
        await sendEmail(
          {
            to: user.email,
            subject: "FUJISAN — パスワードの再設定 / Reset your password",
            text: `FUJISAN SAKE\n\n以下のリンクからパスワードを再設定してください。\nReset your password using the link below:\n\n${url}\n\nこのリクエストに心当たりがない場合は、このメールを破棄してください。\nIf you did not request this, you can safely ignore this email.\n`,
          },
          { apiKey: env.RESEND_API_KEY, from: env.RESEND_FROM },
        );
      },
      /**
       * 登録済みのアドレスで、もう一度新規登録されたとき。
       *
       * `requireEmailVerification` が有効だと、Better Auth は登録の有無を
       * 漏らさないよう、成功と同じ形の返事だけを返して**何も送らない**。
       * 画面には「確認メールを送信しました」と出るのに何も届かず、認証済みの
       * アカウントでは「再送」も黙って成功するだけなので、やはり届かない。
       * 返事はそのままに、アドレスの持ち主にだけ登録済みであることを知らせる。
       *
       * 送信に失敗しても投げない。ここで例外になると、登録済みのアドレスの
       * ときだけ登録がエラーになり、登録の有無が外から分かってしまう。
       */
      onExistingUserSignUp: async ({
        user,
      }: {
        user: { email: string; emailVerified?: boolean; role?: unknown };
      }) => {
        const kind = user.role === "business" ? "business" : "personal";
        const base = (env.BETTER_AUTH_URL ?? "").replace(/\/+$/, "");
        const login = `${base}/login/${kind}`;
        const reset = `${base}/forgot-password/${kind}`;
        const ja = [
          `このメールアドレス（${user.email}）は、すでに会員登録がお済みです。`,
          "登録し直す必要はありません。以下からログインしてください。",
          "",
          `  ログイン: ${login}`,
          `  パスワードをお忘れの場合: ${reset}`,
          ...(googleEnabled
            ? ["", "Google アカウントで登録された場合は、ログイン画面の「Google で続ける」からログインしてください。"]
            : []),
          ...(user.emailVerified
            ? []
            : ["", "メールアドレスの確認がまだお済みでない場合は、ログイン画面でログインすると確認メールを再送できます。"]),
          "",
          "登録のお手続きに心当たりがない場合は、このメールを破棄してください。アカウントには何も変更を加えていません。",
        ];
        const en = [
          "This email address is already registered, so there is no need to sign up again. Please log in instead:",
          "",
          `  Log in: ${login}`,
          `  Forgot your password: ${reset}`,
          "",
          "If you did not try to sign up, you can ignore this email. Nothing about your account has changed.",
        ];
        try {
          await sendEmail(
            {
              to: user.email,
              subject:
                "FUJISAN — ご登録済みのメールアドレスです / This email is already registered",
              text: `FUJISAN SAKE\n\n${ja.join("\n")}\n\n${en.join("\n")}\n`,
            },
            { apiKey: env.RESEND_API_KEY, from: env.RESEND_FROM },
          );
        } catch (error) {
          console.error("[auth] 登録済みアドレスへの案内メールを送れませんでした", error);
        }
      },
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
      /**
       * メールアドレスの変更。
       *
       * **現在のアドレスの承認を先に取る。** セッションを乗っ取られた場合、
       * 新アドレスだけで切り替えられるとアカウントごと奪われ、本来の持ち主は
       * 何も知らないまま締め出される。先に現アドレスへ確認を送れば、
       * 本人は「身に覚えのない変更依頼」に気づける。
       *
       * Better Auth はこの承認リンクを踏んだ時点で **新アドレス宛**の確認メールを
       * 自動で送り（`emailVerification.sendVerificationEmail` を使う）、
       * そちらのリンクを踏んで初めてアドレスが入れ替わる。
       * つまり新旧どちらのアドレスも押さえていないと変更できない。
       */
      changeEmail: {
        enabled: true,
        sendChangeEmailConfirmation: async ({
          user,
          newEmail,
          url,
        }: {
          user: { email: string; name?: string };
          newEmail: string;
          url: string;
        }) => {
          // 宛先は **変更前** のアドレス。ここを newEmail にすると、
          // 現アドレスの持ち主に知らせないまま変更できてしまう。
          await sendEmail(
            {
              to: user.email,
              subject:
                "FUJISAN — メールアドレス変更の確認 / Confirm your email change",
              text: `FUJISAN SAKE\n\nご登録のメールアドレスを次のアドレスへ変更する依頼を受け付けました。\n\n  変更前: ${user.email}\n  変更後: ${newEmail}\n\nお心当たりがある場合は、以下のリンクから承認してください。\n承認後、新しいアドレス宛にも確認メールをお送りします。そちらのリンクを踏んでいただくと変更が完了します。\n\n${url}\n\n**お心当たりが無い場合は、このリンクを開かないでください。**\nこのメールを破棄いただければ、アドレスは変更されません。パスワードの変更もあわせてご検討ください。\n\nWe received a request to change your email address to ${newEmail}.\nIf this was you, approve it with the link above. We'll then email the new address to finish the change.\nIf this wasn't you, do not open the link. Your address will stay as it is.\n`,
            },
            { apiKey: env.RESEND_API_KEY, from: env.RESEND_FROM },
          );
        },
      },
    },
    /**
     * `/api/auth/*` は UI を経由せず **HTTP で直接叩ける**。Server Action 側の
     * 制限（`src/lib/rate-limit.ts`）だけでは、そちらから迂回されてしまう。
     *
     * - `storage: "database"` が肝。既定の `"memory"` はアイソレート内の Map で、
     *   Workers では回数を共有できないため実質機能しない（D1 の `rate_limit` 表を使う）。
     * - `enabled` も明示する。既定は `NODE_ENV === "production"` 頼みで、
     *   Workers 上でその値が期待どおりになる保証が無い。**黙って無効**が
     *   いちばん困るので、環境に関係なく有効にする。
     */
    rateLimit: {
      enabled: true,
      storage: "database" as const,
      window: 60,
      max: 60,
      customRules: {
        // 総当たり対策。Better Auth 既定（10秒で3回＝毎分18回）は緩すぎる。
        "/sign-in/email": { window: 600, max: 10 },
        "/sign-up/email": { window: 3600, max: 5 },
        // メールを送らせる系は、送信そのものが被害になるので特に厳しく。
        "/send-verification-email": { window: 3600, max: 5 },
        "/request-password-reset": { window: 3600, max: 5 },
        "/forget-password": { window: 3600, max: 5 },
        "/reset-password": { window: 600, max: 10 },
        "/change-password": { window: 600, max: 10 },
      },
    },
    advanced: {
      ipAddress: {
        // Cloudflare は CF-Connecting-IP に本物のクライアント IP を入れる。
        // X-Forwarded-For はクライアントが詐称できるので後ろに置く。
        // IP が取れないと Better Auth はレート制限を**丸ごと諦める**ので、
        // ここを外さないこと。
        ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"],
      },
    },
    account: {
      accountLinking: {
        // メール/パスワード登録済みのユーザーが同じメールで Google ログインした際、
        // 既存アカウントへ自動リンクする（未設定だと account_not_linked で弾かれる）。
        // Google はメール確認済みの ID しか返さないため trusted に含めて安全。
        enabled: true,
        trustedProviders: ["google"],
      },
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
  // nextCookies はサーバーアクション内で Set-Cookie を next/headers 経由で適用する。
  // 必ずプラグイン配列の最後に置く。
  const { nextCookies } = await import("better-auth/next-js");
  const { eq } = await import("drizzle-orm");
  const { user: userTable, teamInvite, TEAM_INVITE_TTL_MS } = await import(
    "@/db/schema"
  );
  const { env } = await getCloudflareContext({ async: true });
  const db = await getDb();

  return betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite" }),
    ...buildAuthOptions(env as AuthEnv),
    databaseHooks: {
      user: {
        create: {
          // メール招待で先に予約された admin_role を、新規登録時に付与する。
          // 登録経路（メール/パスワード・Google）を問わず共通で効く。
          after: async (created: { id: string; email: string }) => {
            const email = created.email.trim().toLowerCase();
            const [invite] = await db
              .select({
                adminRole: teamInvite.adminRole,
                createdAt: teamInvite.createdAt,
              })
              .from(teamInvite)
              .where(eq(teamInvite.email, email))
              .limit(1);
            if (!invite) return;

            // 期限切れの招待では権限を付与せず、その場で捨てる。
            // 残しておくと、次に同じアドレスで登録した人にまた判定が走る。
            const issuedAt = new Date(invite.createdAt).getTime();
            if (
              !Number.isFinite(issuedAt) ||
              Date.now() - issuedAt > TEAM_INVITE_TTL_MS
            ) {
              await db.delete(teamInvite).where(eq(teamInvite.email, email));
              return;
            }

            const role = invite.adminRole;
            if (role !== "owner" && role !== "staff") return;
            await db
              .update(userTable)
              .set({ adminRole: role })
              .where(eq(userTable.id, created.id));
            await db.delete(teamInvite).where(eq(teamInvite.email, email));
          },
        },
      },
    },
    plugins: [nextCookies()],
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
 * 実行時には使われないので logger を無効化し、baseURL / secret 未設定による
 * 警告（モジュール読込のたびに出る）を抑止する。
 */
export const auth = betterAuth({
  database: drizzleAdapter({} as never, { provider: "sqlite" }),
  ...buildAuthOptions({}),
  logger: { disabled: true },
});
