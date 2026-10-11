/**
 * The sign-in / sign-up form (U6, R17, R35).
 *
 * One email field and one button. That is the whole form, and the restraint is
 * the requirement rather than a simplification: R17 forbids collecting a child's
 * name, and the cheapest place to enforce that is a form with nowhere to put it.
 *
 * There is no password field because there is no password. Asking for one and
 * then not checking it would teach a parent that the field means something when
 * it does not, which is worse than not having it.
 */
"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import type { AuthActionResult } from "@/lib/auth/types";

/** The outcome a form action returns. */
export type AuthFormAction = (
  credentials: { email: string },
) => Promise<AuthActionResult>;

function ContinueButton(): React.ReactElement {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? "Checking…" : "Continue"}
    </Button>
  );
}

export interface SignInFormProps {
  readonly action: AuthFormAction;
}

export function SignInForm({ action }: SignInFormProps): React.ReactElement {
  const [email, setEmail] = useState("");

  const [state, formAction] = useActionState<AuthActionResult, FormData>(
    async (previous, formData) => {
      void previous;
      return action({ email: String(formData.get("email") ?? "") });
    },
    { ok: true },
  );

  const emailError = state.ok ? undefined : state.error;

  return (
    <form action={formAction} className="auth-form" noValidate>
      <Input
        name="email"
        type="email"
        label="Parent email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={emailError?.message}
        required
      />
      <ContinueButton />
    </form>
  );
}
