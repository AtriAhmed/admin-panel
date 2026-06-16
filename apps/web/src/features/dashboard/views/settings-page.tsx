"use client";

import type { ReactNode } from "react";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  Input,
  Label,
  ListBox,
  Select,
  Separator,
  TextArea,
  TextField,
} from "@heroui/react";

import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  credentialToJson,
  formatPasskeyError,
  isDuplicatePasskeyError,
  isWebAuthnSupported,
  toPublicKeyCreationOptions,
} from "@/lib/auth/webauthn";

const provinces = [
  { id: "on", label: "Ontario" },
  { id: "qc", label: "Quebec" },
  { id: "bc", label: "British Columbia" },
  { id: "ab", label: "Alberta" },
] as const;

const currencies = [
  { id: "cad", label: "CAD - Canadian Dollar" },
  { id: "usd", label: "USD - US Dollar" },
  { id: "eur", label: "EUR - Euro" },
  { id: "gbp", label: "GBP - British Pound" },
  { id: "mxn", label: "MXN - Mexican Peso" },
] as const;

export function SettingsPage({ userId }: { userId: string }) {
  const [passkeyMessage, setPasskeyMessage] = useState<string | null>(null);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [passkeyId, setPasskeyId] = useState<string | null>(null);
  const [isAddingPasskey, setIsAddingPasskey] = useState(false);
  const [isRemovingPasskey, setIsRemovingPasskey] = useState(false);
  const passkeyStorageKey = useMemo(
    () =>
      typeof window === "undefined"
        ? null
        : `admin-panel.passkey.${window.location.hostname}.${userId}`,
    [userId],
  );

  useEffect(() => {
    if (!passkeyStorageKey) {
      return;
    }

    const storedPasskey = readStoredPasskey(window.localStorage.getItem(passkeyStorageKey));

    setHasPasskey(storedPasskey.hasPasskey);
    setPasskeyId(storedPasskey.passkeyId);
  }, [passkeyStorageKey]);

  const markPasskeyAdded = (nextPasskeyId?: string) => {
    if (passkeyStorageKey) {
      window.localStorage.setItem(
        passkeyStorageKey,
        JSON.stringify({ passkeyId: nextPasskeyId ?? null }),
      );
    }

    setHasPasskey(true);
    setPasskeyId(nextPasskeyId ?? null);
  };

  const clearStoredPasskey = () => {
    if (passkeyStorageKey) {
      window.localStorage.removeItem(passkeyStorageKey);
    }

    setHasPasskey(false);
    setPasskeyId(null);
  };

  const addPasskey = async () => {
    setIsAddingPasskey(true);
    setPasskeyMessage(null);
    setPasskeyError(null);

    try {
      if (!isWebAuthnSupported()) {
        throw new Error("Passkeys are not supported in this browser.");
      }

      const start = await fetch("/api/auth/passkeys/register/start", {
        method: "POST",
      }).then((response) =>
        parseApiResponse<{
          passkeyId: string;
          publicKeyCredentialCreationOptions: Record<string, unknown>;
        }>(response),
      );

      const credential = (await navigator.credentials.create({
        publicKey: toPublicKeyCreationOptions(start.publicKeyCredentialCreationOptions),
      })) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error("Passkey creation was cancelled.");
      }

      await fetch("/api/auth/passkeys/register/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passkeyId: start.passkeyId,
          passkeyName: `${navigator.platform || "Browser"} passkey`,
          publicKeyCredential: credentialToJson(credential),
        }),
      }).then((response) => parseApiResponse<{ ok: true }>(response));

      setPasskeyMessage("Passkey added. You can use it next time you sign in.");
      markPasskeyAdded(start.passkeyId);
    } catch (caught) {
      if (isDuplicatePasskeyError(caught)) {
        markPasskeyAdded();
        setPasskeyMessage("This browser already has a passkey for this account.");
        return;
      }

      setPasskeyError(formatPasskeyError(caught, "register"));
    } finally {
      setIsAddingPasskey(false);
    }
  };

  const removePasskey = async () => {
    setIsRemovingPasskey(true);
    setPasskeyMessage(null);
    setPasskeyError(null);

    try {
      if (!passkeyId) {
        clearStoredPasskey();
        setPasskeyMessage(
          "Removed the saved passkey marker for this browser. Older saved passkeys must be removed from your identity provider.",
        );
        return;
      }

      await fetch("/api/auth/passkeys/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ passkeyId }),
      }).then((response) => parseApiResponse<{ ok: true }>(response));

      clearStoredPasskey();
      setPasskeyMessage("Passkey removed for this browser.");
    } catch (caught) {
      setPasskeyError(caught instanceof Error ? caught.message : "Could not remove passkey.");
    } finally {
      setIsRemovingPasskey(false);
    }
  };

  return (
    <form className="mx-auto flex max-w-5xl flex-col gap-4 px-5 pb-10 pt-4">
      <p className="text-muted text-sm">
        Manage your organization profile and preferences.
      </p>

      <Separator />

      <SettingsRow
        description="This will be displayed on your public profile."
        label="Organization Name"
      >
        <TextField name="org-name">
          <Label className="sr-only">Organization Name</Label>
          <Input fullWidth placeholder="Your organization" />
        </TextField>
      </SettingsRow>

      <Separator />

      <SettingsRow
        description="This will be displayed on your public profile. Maximum 240 characters."
        label="Organization Bio"
      >
        <TextField name="org-bio">
          <Label className="sr-only">Organization Bio</Label>
          <TextArea
            fullWidth
            className="min-h-24 resize-y"
            maxLength={240}
            placeholder="Tell customers about your organization"
          />
        </TextField>
      </SettingsRow>

      <Separator />

      <SettingsRow
        description="This is how customers can contact you for support."
        label="Organization Email"
      >
        <TextField name="org-email">
          <Label className="sr-only">Organization Email</Label>
          <Input fullWidth placeholder="info@example.com" type="email" />
        </TextField>
        <Checkbox id="org-email-public" name="org-email-public">
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          <Checkbox.Content>
            <Label htmlFor="org-email-public">Show email on public profile</Label>
          </Checkbox.Content>
        </Checkbox>
      </SettingsRow>

      <Separator />

      <SettingsRow
        description="This is where your organization is registered."
        label="Address"
      >
        <TextField name="address-street">
          <Label className="sr-only">Street address</Label>
          <Input fullWidth placeholder="Street address" />
        </TextField>
        <TextField name="address-city">
          <Label className="sr-only">City</Label>
          <Input fullWidth placeholder="City" />
        </TextField>
        <div className="grid grid-cols-[1fr_160px] gap-3">
          <Select name="address-province" placeholder="Province / State">
            <Label className="sr-only">Province / State</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {provinces.map((province) => (
                  <ListBox.Item id={province.id} key={province.id} textValue={province.label}>
                    {province.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          <TextField name="address-postal">
            <Label className="sr-only">Postal / ZIP</Label>
            <Input fullWidth placeholder="Postal code" />
          </TextField>
        </div>
      </SettingsRow>

      <Separator />

      <SettingsRow
        description="The currency that your organization will be collecting."
        label="Currency"
      >
        <Select name="currency" placeholder="Select currency">
          <Label className="sr-only">Currency</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {currencies.map((currency) => (
                <ListBox.Item id={currency.id} key={currency.id} textValue={currency.label}>
                  {currency.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </SettingsRow>

      <Separator />

      <SettingsRow
        description="Choose the base HeroUI theme or import a HeroUI theme builder export."
        label="Theme"
      >
        <ThemeSwitcher />
      </SettingsRow>

      <Separator />

      <SettingsRow
        description="Add a browser passkey for this admin account."
        label="Passkey"
      >
        <div className="flex flex-col gap-3">
          {hasPasskey ? (
            <div className="flex flex-col gap-3 rounded-md border border-success/30 bg-success/10 px-3 py-2">
              <p className="text-sm text-success">
                Passkey already added for this browser.
              </p>
              {!passkeyId ? (
                <p className="text-xs text-success">
                  This saved marker was created before passkey removal was tracked.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  isDisabled={isRemovingPasskey}
                  onPress={removePasskey}
                  type="button"
                  variant="danger-soft"
                >
                  {isRemovingPasskey
                    ? passkeyId
                      ? "Removing passkey..."
                      : "Clearing marker..."
                    : passkeyId
                      ? "Remove passkey"
                      : "Clear saved marker"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              isDisabled={isAddingPasskey || isRemovingPasskey}
              onPress={addPasskey}
              type="button"
            >
              {isAddingPasskey ? "Adding passkey..." : "Add passkey"}
            </Button>
          )}
          {passkeyMessage ? (
            <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
              {passkeyMessage}
            </p>
          ) : null}
          {passkeyError ? (
            <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {passkeyError}
            </p>
          ) : null}
        </div>
      </SettingsRow>

      <Separator />

      <footer className="flex items-center justify-end gap-2 pt-2">
        <Button type="reset" variant="ghost">
          Reset
        </Button>
        <Button type="submit">Save changes</Button>
      </footer>
    </form>
  );
}

async function parseApiResponse<T>(response: Response) {
  const data = (await response.json().catch(() => null)) as
    | (T & { message?: string })
    | null;

  if (!response.ok) {
    throw new Error(data?.message ?? `Request failed with status ${response.status}.`);
  }

  return data as T;
}

function readStoredPasskey(value: string | null) {
  if (!value) {
    return { hasPasskey: false, passkeyId: null };
  }

  if (value === "true") {
    return { hasPasskey: true, passkeyId: null };
  }

  try {
    const parsed = JSON.parse(value) as { passkeyId?: unknown } | null;
    const passkeyId =
      typeof parsed?.passkeyId === "string" && parsed.passkeyId.trim()
        ? parsed.passkeyId.trim()
        : null;

    return { hasPasskey: true, passkeyId };
  } catch {
    return { hasPasskey: true, passkeyId: null };
  }
}

interface SettingsRowProps {
  children: ReactNode;
  description: string;
  label: string;
}

function SettingsRow({ children, description, label }: SettingsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:gap-10">
      <div className="flex flex-col gap-1">
        <span className="text-foreground text-sm font-medium">{label}</span>
        <p className="text-muted text-xs leading-snug">{description}</p>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
