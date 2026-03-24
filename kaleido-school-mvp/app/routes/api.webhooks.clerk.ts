/**
 * Clerk Webhook Handler
 *
 * Handles webhook events from Clerk:
 * - user.created: Logs when a new user signs up
 * - user.updated: Logs when user data changes
 *
 * Note: StudentPath and Teacher records are NOT created here.
 * They are created during:
 * - Student: Onboarding flow (F04)
 * - Teacher: Teacher sign-up flow (F13)
 */
import { verifyWebhook } from "@clerk/react-router/webhooks";
import type { Route } from "./+types/api.webhooks.clerk";

export async function action({ request }: Route.ActionArgs) {
  try {
    // Verify the webhook signature using Clerk's helper
    const evt = await verifyWebhook(request);
    const eventType = evt.type;

    // Handle different event types
    if (eventType === "user.created") {
      const { id, email_addresses } = evt.data;
      const primaryEmail = email_addresses?.[0]?.email_address;
      console.log(`[Clerk Webhook] User created: ${id} (${primaryEmail})`);
      // StudentPath/Teacher records will be created during onboarding
    }

    if (eventType === "user.updated") {
      const { id } = evt.data;
      console.log(`[Clerk Webhook] User updated: ${id}`);
      // Could sync metadata changes here if needed
    }

    if (eventType === "user.deleted") {
      const { id } = evt.data;
      console.log(`[Clerk Webhook] User deleted: ${id}`);
      // Could handle cleanup here if needed
    }

    return new Response("Webhook received", { status: 200 });
  } catch (err) {
    console.error("[Clerk Webhook] Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }
}
