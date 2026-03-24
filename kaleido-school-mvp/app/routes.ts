import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Home page
  index("routes/home.tsx"),

  // Authentication routes (Clerk)
  route("sign-in", "routes/sign-in.tsx"),
  route("sign-up", "routes/sign-up.tsx"),

  // Onboarding flow — 3 screens (F04)
  route("onboarding/tier", "routes/onboarding.tier.tsx"),
  route("onboarding/teacher-code", "routes/onboarding.teacher-code.tsx"),
  route("onboarding/complete", "routes/onboarding.complete.tsx"),

  // Student dashboard — unit list + Question Bank entry (F05)
  route("dashboard", "routes/dashboard.tsx"),

  // Study unit routes — phase router + P0 cold write (F06) + P1 encoding (F08) + P2 applying (F11)
  route("unit/:unitId", "routes/unit.$unitId.tsx"),
  route("unit/:unitId/p0", "routes/unit.$unitId.p0.tsx"),
  route("unit/:unitId/p1", "routes/unit.$unitId.p1.tsx"),
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

  // API routes
  route("api/webhooks/clerk", "routes/api.webhooks.clerk.ts"),
] satisfies RouteConfig;
