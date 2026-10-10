/**
 * The public layout is the frame every marketing page renders inside, so its
 * structure is a contract of its own (R33): one banner, one main, one
 * contentinfo, and a skip link that actually reaches the main content for a
 * keyboard user.
 */
import { render, screen, within } from "@testing-library/react";
import PublicLayout, { metadata } from "./layout";

describe("public layout", () => {
  it("supplies the title template and the social preview defaults every page inherits", () => {
    expect(metadata.title).toEqual({
      default: "Heir of Wisdom",
      template: "%s · Heir of Wisdom",
    });
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      siteName: "Heir of Wisdom",
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it("renders the header, the page body and the footer as landmarks", () => {
    render(
      <PublicLayout>
        <p>Page body</p>
      </PublicLayout>,
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("puts the page body inside main", () => {
    render(
      <PublicLayout>
        <p>Page body</p>
      </PublicLayout>,
    );

    expect(within(screen.getByRole("main")).getByText("Page body")).toBeInTheDocument();
  });

  it("gives keyboard users a skip link that targets the main region", () => {
    render(
      <PublicLayout>
        <p>Page body</p>
      </PublicLayout>,
    );

    const skipLink = screen.getByRole("link", { name: "Skip to main content" });
    const href = skipLink.getAttribute("href") ?? "";

    expect(href.startsWith("#")).toBe(true);
    expect(document.querySelector(href)).toBe(screen.getByRole("main"));
  });

  it("keeps the frame free of a second H1", () => {
    const { container } = render(
      <PublicLayout>
        <h1>Page heading</h1>
      </PublicLayout>,
    );

    expect(container.querySelectorAll("h1")).toHaveLength(1);
  });
});