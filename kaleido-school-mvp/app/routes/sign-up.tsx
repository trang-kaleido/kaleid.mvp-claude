/**
 * Sign-Up Page
 *
 * Uses Clerk's pre-built SignUp component for user registration.
 * Email/password only for MVP (OAuth disabled).
 */
import { SignUp } from "@clerk/react-router";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignUp />
    </div>
  );
}
