import { Callout } from "@/components/ui";

/**
 * Whether the legal copy has been through a qualified reviewer (R4).
 *
 * "draft" is the only honest value today. Nobody with the training to sign off
 * on a children's-privacy notice has read this copy, so the pages must say so
 * above the fold rather than presenting placeholder text as settled terms.
 */
export type LegalCopyStatus = "draft" | "approved";

/**
 * The status both legal pages render from. Flipping this to "approved" is a
 * decision made *with* reviewed copy in the same change, never on its own: the
 * banner is what stops an unreviewed notice from being mistaken for one.
 */
export const LEGAL_COPY_STATUS: LegalCopyStatus = "draft";

export interface ReviewBannerProps {
  /** Which document the banner sits on, e.g. "privacy notice". */
  readonly documentName: string;
  readonly status?: LegalCopyStatus;
}

/**
 * The banner that marks a legal page as unreviewed.
 *
 * It renders nothing once the copy is approved, which is the only state in
 * which its absence is honest — a banner left on an approved page would train a
 * reader to ignore it, and a banner missing from an unapproved page would let a
 * draft pass for a promise.
 */
export function ReviewBanner({
  documentName,
  status = LEGAL_COPY_STATUS,
}: ReviewBannerProps) {
  if (status === "approved") return null;

  return (
    <Callout tone="warning" title="Not approved legal copy">
      This {documentName} was written by the team. A qualified legal reviewer has
      not read it, so it is not approved and nothing on this page should be
      relied on. It will be replaced with copy that reviewer has written before
      the service launches.
    </Callout>
  );
}