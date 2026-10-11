/**
 * The contact form (U9, R4, R12, R35).
 *
 * Two rules shape this page.
 *
 * The browser's constraint validation is the first line, but a form is not a
 * boundary a stranger can be trusted to respect, so the action re-checks every
 * field and reports which ones it rejected.
 *
 * And this build has no mail transport. The page says so before anyone types
 * anything, and says it again after they submit, because the second time is the
 * moment a parent is actually waiting to hear back. A success message that no
 * delivery backs is the specific failure this page is built to avoid.
 */
import { use } from "react";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui";
import { deliver } from "./actions";

export const metadata = {
  title: "Contact · Heir of Wisdom",
  description: "Send a question or report a problem with Heir of Wisdom.",
  openGraph: {
    title: "Contact · Heir of Wisdom",
    description: "Send a question or report a problem with Heir of Wisdom.",
  },
};

/** Minimum name length — one initial is not enough to reply to. */
const MIN_NAME_LENGTH = 2;
/** Minimum message length, mirrored by the field's `minLength`. */
const MIN_MESSAGE_LENGTH = 10;
/** Maximum message length, mirrored by the field's `maxLength`. */
const MAX_MESSAGE_LENGTH = 2000;

type FieldName = "name" | "email" | "message";

const FIELD_LABELS: Record<FieldName, string> = {
  name: "Your name",
  email: "Your email",
  message: "Your message",
};

/**
 * Re-check a submission at the server boundary.
 *
 * Returns the fields that failed rather than a single verdict, so the page can
 * put each problem on the field it belongs to.
 */
function rejectInvalid(formData: FormData): FieldName[] {
  const rejected: FieldName[] = [];

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (name.length < MIN_NAME_LENGTH) rejected.push("name");
  if (!email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
    rejected.push("email");
  }
  if (message.length < MIN_MESSAGE_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
    rejected.push("message");
  }

  return rejected;
}

async function sendMessage(formData: FormData): Promise<void> {
  const rejected = rejectInvalid(formData);

  if (rejected.length > 0) {
    redirect(`/contact?problem=${rejected.join(",")}`);
  }

  await deliver({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    message: String(formData.get("message") ?? ""),
  });

  // Nothing was delivered. Saying so is the honest outcome, and it is also the
  // signal the page renders its "no one received this" alert from.
  redirect("/contact?delivery=none");
}

/** Which fields a `?problem=` value names, ignoring anything unrecognised. */
function parseProblem(value: string | undefined): readonly FieldName[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry): entry is FieldName => entry in FIELD_LABELS);
}

/**
 * The fallback for a render with no `searchParams`.
 *
 * A request always supplies one; the shared public-route test renders the page
 * without it. The thenable is marked fulfilled so `use` reads it synchronously
 * rather than suspending on a promise that is already resolved — otherwise the
 * component renders nothing at all outside a request.
 */
const NO_PARAMS = Object.assign(
  Promise.resolve<Readonly<Record<string, string>>>({}) as Promise<
    Readonly<Record<string, string>>
  > & { status: string; value: Readonly<Record<string, string>> },
  { status: "fulfilled", value: {} },
);

interface ContactPageProps {
  searchParams?: Promise<Readonly<Record<string, string>>>;
}

/**
 * Read with `use()` rather than `await`.
 *
 * Next hands the page its `searchParams` as a promise, and `use()` reads it
 * without making the component async — which keeps the whole page synchronous
 * and lets it render in a single pass, the same way it does on a request.
 */
export default function ContactPage(props: ContactPageProps = {}) {
  const { searchParams } = props;
  const params = use(searchParams ?? NO_PARAMS);
  const rejected = new Set(parseProblem(params.problem));
  const delivery = params.delivery;

  return (
    <main className="contact-page" aria-labelledby="contact-heading">
      <h1 id="contact-heading">Contact</h1>

      <p>
        {`Questions, problems, and anything that looks wrong are welcome. Please do not include your child's name or any other identifying detail about them.`}
      </p>

      <aside role="note" className="contact-page__delivery-note">
        <p>
          <strong>This build does not send anything.</strong> There is no mail
          delivery connected, so a message typed here is not transmitted and
          nothing you type is stored after the page reloads.
        </p>
      </aside>

      {delivery === "none" && (
        <div role="alert" className="contact-page__alert">
          <p>
            <strong>Your message was not delivered.</strong> This build has no mail
            transport connected, so no one received it. Nothing was sent and
            nothing was saved.
          </p>
        </div>
      )}

      <form aria-label="Send a message" action={sendMessage}>
        <Input
          name="name"
          label="Your name"
          autoComplete="name"
          required
          error={rejected.has("name") ? "Enter your name." : undefined}
        />
        <Input
          name="email"
          type="email"
          label="Your email"
          autoComplete="email"
          inputMode="email"
          required
          error={rejected.has("email") ? "Enter a valid email address." : undefined}
        />
        <Input
          name="message"
          label="Your message"
          required
          minLength={MIN_MESSAGE_LENGTH}
          maxLength={MAX_MESSAGE_LENGTH}
          error={
            rejected.has("message")
              ? `Enter at least ${MIN_MESSAGE_LENGTH} characters.`
              : undefined
          }
        />
        <button type="submit" className="button button--primary">
          Send message
        </button>
      </form>
    </main>
  );
}
