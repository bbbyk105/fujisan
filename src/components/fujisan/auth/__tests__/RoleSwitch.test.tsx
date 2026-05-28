import { render } from "@testing-library/react";
import { RoleSwitch } from "@/components/fujisan/auth/RoleSwitch";

describe("RoleSwitch", () => {
  it("login mode links to /login/* and marks the active role", () => {
    const { container } = render(<RoleSwitch active="personal" mode="login" />);
    const links = Array.from(container.querySelectorAll("a"));

    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "/login/personal",
      "/login/business",
    ]);
    const active = links.find(
      (a) => a.getAttribute("aria-selected") === "true",
    );
    expect(active?.getAttribute("href")).toBe("/login/personal");
  });

  it("register mode links to /register/* and marks the active role", () => {
    const { container } = render(
      <RoleSwitch active="business" mode="register" />,
    );
    const links = Array.from(container.querySelectorAll("a"));

    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "/register/personal",
      "/register/business",
    ]);
    const active = container.querySelector('a[aria-selected="true"]');
    expect(active?.getAttribute("href")).toBe("/register/business");
  });
});
