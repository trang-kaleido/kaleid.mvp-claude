/**
 * Authentication Helper Functions
 *
 * Server-side helpers for route protection. These functions check if a user
 * is authenticated and has the correct role (student or teacher).
 *
 * Usage in loaders:
 *   const clerkUserId = await requireStudent(args);
 *   // or
 *   const clerkUserId = await requireTeacher(args);
 */
import { getAuth, clerkClient } from "@clerk/react-router/server";
import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
// Note: LoaderFunctionArgs is the generic base type — all route-specific
// LoaderFunctionArgs extend it. Using it here means requireStudent /
// requireTeacher can be called from any route's loader, not just root.

/**
 * Requires the user to be authenticated and have the "student" role.
 * Redirects to /sign-in if not authenticated, /unauthorized if wrong role.
 *
 * @param args - The loader args containing the request
 * @returns The Clerk user ID (to look up StudentPath)
 */
export async function requireStudent(
  args: LoaderFunctionArgs
): Promise<string> {
  const { userId } = await getAuth(args);

  if (!userId) {
    throw redirect("/sign-in");
  }

  // Get full user data to check role in publicMetadata
  const user = await clerkClient(args).users.getUser(userId);
  const role = user.publicMetadata?.role as string | undefined;

  if (role !== "student") {
    throw redirect("/unauthorized");
  }

  return userId;
}

/**
 * Requires the user to be authenticated and have the "teacher" role.
 * Redirects to /sign-in if not authenticated, /unauthorized if wrong role.
 *
 * @param args - The loader args containing the request
 * @returns The Clerk user ID (to look up Teacher record)
 */
export async function requireTeacher(
  args: LoaderFunctionArgs
): Promise<string> {
  const { userId } = await getAuth(args);

  if (!userId) {
    throw redirect("/sign-in");
  }

  // Get full user data to check role in publicMetadata
  const user = await clerkClient(args).users.getUser(userId);
  const role = user.publicMetadata?.role as string | undefined;

  if (role !== "teacher") {
    throw redirect("/unauthorized");
  }

  return userId;
}

/**
 * Gets the current user ID if authenticated, otherwise returns null.
 * Does not redirect - useful for optional auth checks.
 *
 * @param args - The loader args containing the request
 * @returns The Clerk user ID or null
 */
export async function getOptionalUserId(
  args: LoaderFunctionArgs
): Promise<string | null> {
  const { userId } = await getAuth(args);
  return userId;
}
