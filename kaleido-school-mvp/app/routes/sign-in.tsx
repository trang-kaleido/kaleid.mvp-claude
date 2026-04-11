/**
 * Sign-In Page
 *
 * Uses Clerk's pre-built SignIn component for authentication.
 * Email/password only for MVP (OAuth disabled).
 */
import { SignIn } from "@clerk/react-router";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignIn forceRedirectUrl="/" />
    </div>
  );
}
