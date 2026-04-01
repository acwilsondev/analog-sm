import test from "node:test";
import assert from "node:assert/strict";
import type { Member, Invite, AuditLog } from "./entities.js";

test("Member entity type check", () => {
  const member: Member = {
    id: "uuid-1",
    email: "test@example.com",
    role: "admin",
    isActive: true,
    createdAt: new Date()
  };
  assert.strictEqual(member.role, "admin");
});

test("Invite entity type check", () => {
  const invite: Invite = {
    id: "invite-1",
    code: "secret-code",
    role: "member",
    maxUses: 1,
    useCount: 0,
    createdBy: "admin-1",
    createdAt: new Date()
  };
  assert.strictEqual(invite.code, "secret-code");
});

test("AuditLog entity type check", () => {
  const log: AuditLog = {
    id: "log-1",
    action: "LOGIN_SUCCESS",
    details: { ip: "127.0.0.1" },
    createdAt: new Date()
  };
  assert.strictEqual(log.action, "LOGIN_SUCCESS");
});
