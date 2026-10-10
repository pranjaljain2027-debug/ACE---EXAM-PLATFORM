import type { Metadata } from "next";

/**
 * U9 updates this file rather than creating it, and replaces this placeholder
 * with the contact form and its delivery states. Nothing here promises a reply
 * time or a channel that does not exist yet.
 */
export const metadata: Metadata = {
  title: "Contact and support",
  description: "Questions, problems, and feedback for Heir of Wisdom.",
  openGraph: {
    title: "Contact and support · Heir of Wisdom",
    description: "Questions, problems, and feedback for Heir of Wisdom.",
  },
};

export default function ContactPage() {
  return (
    <>
      <h1>Contact and support</h1>
      <p>
        This page is a placeholder. The form that belongs here — and the honest
        account of where a message goes once it is sent — is still being built.
      </p>
    </>
  );
}