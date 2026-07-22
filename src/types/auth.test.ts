import { describe, expect, it } from "vitest";
import {
  hasPermission,
  isAdminAppRole,
  mapRolesToAuthRole,
} from "./auth";
import {
  buyerOnboardingInputSchema,
  signUpInputSchema,
} from "../validators/auth";

describe("mapRolesToAuthRole", () => {
  it("never maps arbitrary strings to admin", () => {
    expect(mapRolesToAuthRole(["user"])).toBe("buyer");
    expect(mapRolesToAuthRole([])).toBe("buyer");
  });

  it("maps buyer and supplier combinations", () => {
    expect(mapRolesToAuthRole(["buyer"])).toBe("buyer");
    expect(mapRolesToAuthRole(["supplier"])).toBe("supplier");
    expect(mapRolesToAuthRole(["buyer", "supplier"])).toBe("both");
  });

  it("maps admin family roles to admin UI role", () => {
    expect(mapRolesToAuthRole(["admin"])).toBe("admin");
    expect(mapRolesToAuthRole(["super_admin"])).toBe("admin");
    expect(mapRolesToAuthRole(["finance_admin", "buyer"])).toBe("admin");
  });
});

describe("signup metadata hardening (client validators)", () => {
  it("only allows buyer/supplier/both intended account types", () => {
    expect(() =>
      signUpInputSchema.parse({
        email: "a@b.com",
        password: "secret1",
        fullName: "Test",
        intendedAccountType: "admin",
      }),
    ).toThrow();

    expect(
      signUpInputSchema.parse({
        email: "a@b.com",
        password: "secret1",
        fullName: "Test",
        intendedAccountType: "buyer",
      }).intendedAccountType,
    ).toBe("buyer");
  });
});

describe("hasPermission", () => {
  it("grants all permissions to super_admin", () => {
    expect(hasPermission([], ["super_admin"], "payments.manage")).toBe(true);
  });

  it("requires explicit permission otherwise", () => {
    expect(hasPermission(["orders.read"], ["admin"], "payments.manage")).toBe(false);
    expect(hasPermission(["payments.manage"], ["finance_admin"], "payments.manage")).toBe(true);
  });
});

describe("isAdminAppRole", () => {
  it("does not treat buyer/supplier as admin", () => {
    expect(isAdminAppRole("buyer")).toBe(false);
    expect(isAdminAppRole("supplier")).toBe(false);
    expect(isAdminAppRole("admin")).toBe(true);
  });
});

describe("buyer onboarding validation", () => {
  it("requires business name", () => {
    expect(() => buyerOnboardingInputSchema.parse({ businessName: "" })).toThrow();
    expect(buyerOnboardingInputSchema.parse({ businessName: "Acme Trading" }).businessName).toBe(
      "Acme Trading",
    );
  });
});
