import { sendEmail } from "@/lib/email";

describe("sendEmail", () => {
  const realFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
    jest.restoreAllMocks();
  });

  it("dev fallback: without apiKey it logs and does NOT call fetch", async () => {
    const fetchSpy = jest.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await sendEmail({ to: "a@example.com", subject: "S", text: "T" }, {});

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
  });

  it("with apiKey: POSTs to Resend with bearer auth and JSON body", async () => {
    const fetchSpy = jest.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    await sendEmail(
      { to: "a@example.com", subject: "Hello", text: "Body" },
      { apiKey: "key_123", from: "FUJISAN <f@x.com>" },
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(opts.method).toBe("POST");
    expect((opts.headers as Record<string, string>).Authorization).toBe(
      "Bearer key_123",
    );
    const body = JSON.parse(opts.body as string);
    expect(body.to).toBe("a@example.com");
    expect(body.subject).toBe("Hello");
    expect(body.from).toBe("FUJISAN <f@x.com>");
  });

  it("throws when Resend responds with a non-ok status", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "bad request",
    }) as unknown as typeof fetch;

    await expect(
      sendEmail({ to: "a@example.com", subject: "S", text: "T" }, { apiKey: "k" }),
    ).rejects.toThrow(/Resend/);
  });
});
