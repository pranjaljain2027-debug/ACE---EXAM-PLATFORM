/**
 * The banner is the only thing between a draft and a page that reads as
 * approved legal text (R4). Nothing about the copy it labels is trustworthy yet
 * — no lawyer has read it — so the banner has to say so in the page's own
 * words, and it has to keep saying so for as long as the status is "draft".
 *
 * These tests drive the component the pages render, not the status constant on
 * its own: a banner that is present but says nothing useful fails here.
 */
import { render, screen } from "@testing-library/react";
import { LEGAL_COPY_STATUS, ReviewBanner } from "./ReviewBanner";

describe("ReviewBanner", () => {
  it("marks the copy as unapproved while the module declares it a draft", () => {
    expect(LEGAL_COPY_STATUS).toBe("draft");

    render(<ReviewBanner documentName="privacy notice" />);

    const banner = screen.getByRole("note");
    expect(banner).toHaveTextContent(/not approved/i);
    expect(banner).toHaveTextContent(/qualified legal reviewer/i);
  });

  it("names the document it sits on, so neither page is left ambiguous", () => {
    render(<ReviewBanner documentName="terms of use" />);

    expect(screen.getByRole("note")).toHaveTextContent(/terms of use/i);
  });

  it("tells a reader not to rely on the copy", () => {
    render(<ReviewBanner documentName="privacy notice" />);

    expect(screen.getByRole("note")).toHaveTextContent(/relied on/i);
  });

  it("disappears only when a reviewer has approved the copy", () => {
    const { container } = render(<ReviewBanner documentName="privacy notice" status="approved" />);

    expect(container).toBeEmptyDOMElement();
  });
});