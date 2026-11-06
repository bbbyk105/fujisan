import {
  CONTACT_SUBJECTS,
  CONTACT_SUBJECT_LABELS,
} from "@/data/fujisan-contact";

describe("お問い合わせの用件", () => {
  it("蔵見学は受け付けない", () => {
    expect(CONTACT_SUBJECTS).not.toContain("visit");
  });

  it("過去の蔵見学のお問い合わせは管理画面で表示できる", () => {
    expect(CONTACT_SUBJECT_LABELS.visit.ja).toBe("蔵見学");
  });
});
