/**
 * The demo-mode banner (U6, R14).
 *
 * R14 asks for a demo mode that is "visually and technically distinct, and never
 * implies mock authentication secures real data". Both halves matter: a parent
 * has to be able to tell at a glance that nothing here is real, and the copy must
 * not make a promise about their data just by describing it carefully.
 *
 * The wording is therefore written to *avoid* the vocabulary a security claim is
 * made of rather than to argue with it. "Nothing is written to this device" is
 * chosen over "your data is not shared" because the first is checkable and the
 * second is a claim. `DemoModeBanner.test.tsx` asserts the absence of every one
 * of those terms, and exercises the assertion itself against strings that would
 * breach R14, so a passing banner means something.
 */
import { STYLE_ID, styles } from "./demoBannerStyles";

export function DemoModeBanner(): React.ReactElement {
  return (
    <>
      <style id={STYLE_ID} href={STYLE_ID}>{styles}</style>
      <aside className="auth-demo-banner" role="note" aria-label="Demo mode">
        <p className="auth-demo-banner__title">Demo mode</p>
        <p className="auth-demo-banner__body">
          There are no real accounts in this build. Records are held in a file on
          the server while the app is running, and stay there until the file is
          deleted.
        </p>
        <p className="auth-demo-banner__body">
          Nothing is written to this device, and please do not enter your
          child&rsquo;s name or any other identifying details.
        </p>
      </aside>
    </>
  );
}
