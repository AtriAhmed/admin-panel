"use client";

import { Button, Card, Input } from "@heroui/react";
import { ArrowRightToSquare } from "@gravity-ui/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import {
  credentialToJson,
  formatPasskeyError,
  isWebAuthnSupported,
  toPublicKeyRequestOptions,
} from "@/lib/auth/webauthn";

type AuthMode = "login" | "request-reset" | "confirm-reset";

type ApiErrorResponse = {
  message?: string;
};

async function parseApiResponse<T>(response: Response) {
  const data = (await response.json().catch(() => null)) as (T & ApiErrorResponse) | null;

  if (!response.ok) {
    throw new Error(data?.message ?? `Request failed with status ${response.status}.`);
  }

  return data as T;
}

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(
    searchParams.has("code") ? "confirm-reset" : "login",
  );
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [resetRequestId, setResetRequestId] = useState("");
  const [resetLoginName, setResetLoginName] = useState("");
  const [resetCode, setResetCode] = useState(searchParams.get("code") ?? "");
  const [resetUserId, setResetUserId] = useState(
    searchParams.get("userID") ?? searchParams.get("userId") ?? "",
  );
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(() => {
    const callbackError = searchParams.get("error");

    if (!callbackError) {
      return null;
    }

    return callbackError === "unsupported_provider"
      ? "That sign-in provider is not supported."
      : callbackError;
  });
  const [isBusy, setIsBusy] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);

  const canSubmit = useMemo(() => {
    if (isBusy) return false;

    if (mode === "login") {
      return loginName.trim().length > 0 && password.length > 0;
    }

    if (mode === "request-reset") {
      return resetLoginName.trim().length > 0;
    }

    return (
      newPassword.length > 0 &&
      resetCode.trim().length > 0 &&
      (resetUserId.trim().length > 0 || resetRequestId.trim().length > 0)
    );
  }, [
    isBusy,
    loginName,
    mode,
    newPassword,
    password,
    resetCode,
    resetLoginName,
    resetRequestId,
    resetUserId,
  ]);

  const signIn = async () => {
    await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        loginName: loginName.trim(),
        password,
      }),
    }).then((response) => parseApiResponse<{ user: unknown }>(response));

    router.replace("/");
    router.refresh();
  };

  const requestReset = async () => {
    const data = await fetch("/api/auth/password-reset/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        loginName: resetLoginName.trim(),
      }),
    }).then((response) =>
      parseApiResponse<{ message?: string; resetRequestId?: string }>(response),
    );

    setResetRequestId(data.resetRequestId ?? "");
    setMessage(data.message ?? "If that account exists, a password reset link has been sent.");
    setMode("confirm-reset");
  };

  const confirmReset = async () => {
    await fetch("/api/auth/password-reset/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: resetCode.trim(),
        newPassword,
        resetRequestId: resetRequestId.trim(),
        userId: resetUserId.trim(),
      }),
    }).then((response) => parseApiResponse<{ ok: true }>(response));

    setPassword("");
    setNewPassword("");
    setResetCode("");
    setResetUserId("");
    setResetRequestId("");
    setLoginName(resetLoginName);
    setMessage("Password reset. You can sign in with the new password.");
    setMode("login");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsBusy(true);

    try {
      if (mode === "login") {
        await signIn();
      } else if (mode === "request-reset") {
        await requestReset();
      } else {
        await confirmReset();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const showResetRequest = () => {
    setResetLoginName(loginName);
    setMode("request-reset");
    setError(null);
    setMessage(null);
  };

  const showLogin = () => {
    setMode("login");
    setError(null);
    setMessage(null);
  };

  const signInWithProvider = (provider: "google" | "apple") => {
    window.location.assign(`/api/auth/idp/start?provider=${provider}`);
  };

  const signInWithPasskey = async () => {
    setError(null);
    setMessage(null);
    setPasskeyBusy(true);

    try {
      if (!isWebAuthnSupported()) {
        throw new Error("Passkeys are not supported in this browser.");
      }

      const start = await fetch("/api/auth/passkeys/login/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loginName: loginName.trim(),
        }),
      }).then((response) =>
        parseApiResponse<{
          passkeyLoginToken: string;
          publicKeyCredentialRequestOptions: Record<string, unknown>;
        }>(response),
      );

      const credential = (await navigator.credentials.get({
        publicKey: toPublicKeyRequestOptions(start.publicKeyCredentialRequestOptions),
      })) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error("Passkey sign-in was cancelled.");
      }

      await fetch("/api/auth/passkeys/login/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passkeyLoginToken: start.passkeyLoginToken,
          publicKeyCredential: credentialToJson(credential),
        }),
      }).then((response) => parseApiResponse<{ user: unknown }>(response));

      router.replace("/");
      router.refresh();
    } catch (caught) {
      setError(formatPasskeyError(caught, "login"));
    } finally {
      setPasskeyBusy(false);
    }
  };

  return (
    <main className="bg-background flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <p className="text-muted text-sm font-medium">Admin Panel</p>
          <h1 className="text-foreground mt-2 text-3xl font-semibold">Sign in</h1>
        </div>

        <Card className="rounded-lg">
          <form onSubmit={onSubmit}>
            <Card.Header>
              <Card.Title>
                {mode === "login"
                  ? "Administrator access"
                  : mode === "request-reset"
                    ? "Reset password"
                    : "Set a new password"}
              </Card.Title>
              <Card.Description>
                {mode === "login"
                  ? "Use your ZITADEL account to continue."
                  : mode === "request-reset"
                    ? "Enter the account email or username."
                    : "Enter the code from your email link."}
              </Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4">
              {mode === "login" ? (
                <>
                  <Field label="Email or username">
                    <Input
                      aria-label="Email or username"
                      autoComplete="username"
                      autoFocus
                      fullWidth
                      onChange={(event) => setLoginName(event.target.value)}
                      placeholder="name@example.com"
                      type="text"
                      value={loginName}
                    />
                  </Field>
                  <Field label="Password">
                    <Input
                      aria-label="Password"
                      autoComplete="current-password"
                      fullWidth
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Password"
                      type="password"
                      value={password}
                    />
                  </Field>
                </>
              ) : mode === "request-reset" ? (
                <Field label="Email or username">
                  <Input
                    aria-label="Email or username"
                    autoComplete="username"
                    autoFocus
                    fullWidth
                    onChange={(event) => setResetLoginName(event.target.value)}
                    placeholder="name@example.com"
                    type="text"
                    value={resetLoginName}
                  />
                </Field>
              ) : (
                <>
                  <Field label="Reset code">
                    <Input
                      aria-label="Reset code"
                      autoComplete="one-time-code"
                      autoFocus={!resetCode}
                      fullWidth
                      onChange={(event) => setResetCode(event.target.value)}
                      placeholder="Code from email"
                      value={resetCode}
                    />
                  </Field>
                  <Field label="New password">
                    <Input
                      aria-label="New password"
                      autoComplete="new-password"
                      autoFocus={Boolean(resetCode)}
                      fullWidth
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="New password"
                      type="password"
                      value={newPassword}
                    />
                  </Field>
                </>
              )}

              {message ? (
                <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {message}
                </p>
              ) : null}
              {error ? (
                <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              ) : null}
            </Card.Content>
            <Card.Footer className="mt-2 flex-col items-stretch gap-3">
              <Button isDisabled={!canSubmit} type="submit">
                <ArrowRightToSquare className="size-4" />
                {mode === "login"
                  ? isBusy
                    ? "Signing in..."
                    : "Sign in"
                  : mode === "request-reset"
                    ? isBusy
                      ? "Sending..."
                      : "Send reset link"
                    : isBusy
                      ? "Resetting..."
                      : "Reset password"}
              </Button>
              {mode === "login" ? (
                <>
                  <div className="flex items-center gap-3 py-1">
                    <span className="h-px flex-1 bg-divider" />
                    <span className="text-muted text-xs font-medium">or</span>
                    <span className="h-px flex-1 bg-divider" />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button
                      onPress={() => signInWithProvider("google")}
                      type="button"
                      variant="outline"
                    >
                      <span className="flex size-4 items-center justify-center text-xs font-semibold">
                        G
                      </span>
                      Google
                    </Button>
                    <Button
                      onPress={() => signInWithProvider("apple")}
                      type="button"
                      variant="outline"
                    >
                      <span className="flex size-4 items-center justify-center text-sm font-semibold">
                        A
                      </span>
                      Apple
                    </Button>
                  </div>
                  <Button
                    isDisabled={passkeyBusy || loginName.trim().length === 0}
                    onPress={signInWithPasskey}
                    type="button"
                    variant="secondary"
                  >
                    {passkeyBusy ? "Opening passkey..." : "Continue with passkey"}
                  </Button>
                  <Button type="button" variant="ghost" onPress={showResetRequest}>
                    Forgot password?
                  </Button>
                </>
              ) : (
                <Button type="button" variant="ghost" onPress={showLogin}>
                  Back to sign in
                </Button>
              )}
            </Card.Footer>
          </form>
        </Card>
      </div>
    </main>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      <span className="text-foreground">{label}</span>
      {children}
    </label>
  );
}
