/**
 * The contact form's delivery adapter (U9, R35).
 *
 * There is no mail transport in this build, so there is nothing to deliver to.
 * The adapter says exactly that rather than reporting a success it cannot
 * back — a form that says "message sent" when nothing was sent is worse than a
 * form that admits it is not connected.
 *
 * The seam is here so a transport can be added later without the page changing:
 * a real implementation replaces `deliver` and the page's copy stops being the
 * thing that has to be updated.
 */

/** What happened to a submitted message. */
export type DeliveryResult = {
  /** Always `"none"` in this build. */
  readonly status: "none";
  /** Whether anything was actually handed to a transport. */
  readonly delivered: false;
};

export type ContactMessage = {
  readonly name: string;
  readonly email: string;
  readonly message: string;
};

/**
 * Accept a submission and report honestly that it went nowhere.
 *
 * The parameters are destructured into nothing on purpose: there is no transport
 * to hand them to, and keeping the signature is what lets a real one be added
 * later without the page or its form action changing.
 */
export async function deliver(..._ignored: [ContactMessage]): Promise<DeliveryResult> {
  void _ignored;
  return { status: "none", delivered: false };
}
