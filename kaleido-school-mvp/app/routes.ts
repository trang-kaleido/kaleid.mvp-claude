import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Home page
  index("routes/home.tsx"),

  // Authentication routes (Clerk) — wildcard handles multi-step sub-paths
  route("sign-in/*", "routes/sign-in.tsx"),
  route("sign-up/*", "routes/sign-up.tsx"),

  // Onboarding flow — 4 screens (F04): intro → tier → teacher-code → complete
  route("onboarding/intro", "routes/onboarding.intro.tsx"),
  route("onboarding/tier", "routes/onboarding.tier.tsx"),
  route("onboarding/teacher-code", "routes/onboarding.teacher-code.tsx"),
  route("onboarding/complete", "routes/onboarding.complete.tsx"),

  // Student dashboard — unit list + Question Bank entry (F05)
  route("dashboard", "routes/dashboard.tsx"),

  // Study unit routes — phase router (F06)
  route("unit/:unitId", "routes/unit.$unitId.tsx"),

  // P0 — Cold Write (F06)
  route("unit/:unitId/p0/intro", "routes/unit.$unitId.p0.intro.tsx"),
  route("unit/:unitId/p0", "routes/unit.$unitId.p0.tsx"),

  // P1 — Encoding: three sub-routes (F16, F17, F08)
  route("unit/:unitId/p1/pov-intro", "routes/unit.$unitId.p1.pov-intro.tsx"),
  route("unit/:unitId/p1/pov-encoding", "routes/unit.$unitId.p1.pov-encoding.tsx"),
  route("unit/:unitId/p1/essay-encoding", "routes/unit.$unitId.p1.essay-encoding.tsx"),

  // P2 — Applying (F11)
  route("unit/:unitId/p2/intro", "routes/unit.$unitId.p2.intro.tsx"),
  route("unit/:unitId/p2", "routes/unit.$unitId.p2.tsx"),

  // Unit completion screens (F12)
  route("unit-complete/:unitId", "routes/unit-complete.$unitId.tsx"),
  route("path-complete", "routes/path-complete.tsx"),

  // Question Bank (F14)
  route("question-bank", "routes/question-bank.tsx"),
  route("question-bank/:questionId", "routes/question-bank.$questionId.tsx"),

  // Educator Console (F15)
  route("educator/students", "routes/educator.students.tsx"),
  route("educator/:studentId", "routes/educator.$studentId.tsx"),

  // Fallback
  route("unauthorized", "routes/unauthorized.tsx"),

  // API routes
  route("api/webhooks/clerk", "routes/api.webhooks.clerk.ts"),
] satisfies RouteConfig;
