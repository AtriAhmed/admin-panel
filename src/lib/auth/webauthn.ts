type JsonRecord = Record<string, unknown>;

function base64UrlToBuffer(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = window.atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

function bufferToBase64Url(buffer: ArrayBuffer | null) {
  if (!buffer) {
    return null;
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrapPublicKeyOptions(options: JsonRecord) {
  return isRecord(options.publicKey) ? options.publicKey : options;
}

export function isWebAuthnSupported() {
  return typeof window !== "undefined" && Boolean(window.PublicKeyCredential);
}

export function toPublicKeyCreationOptions(options: JsonRecord) {
  const publicKey = { ...unwrapPublicKeyOptions(options) } as JsonRecord;

  if (typeof publicKey.challenge === "string") {
    publicKey.challenge = base64UrlToBuffer(publicKey.challenge);
  }

  if (isRecord(publicKey.user) && typeof publicKey.user.id === "string") {
    publicKey.user = {
      ...publicKey.user,
      id: base64UrlToBuffer(publicKey.user.id),
    };
  }

  if (Array.isArray(publicKey.excludeCredentials)) {
    publicKey.excludeCredentials = publicKey.excludeCredentials.map((credential) => {
      if (!isRecord(credential) || typeof credential.id !== "string") {
        return credential;
      }

      return {
        ...credential,
        id: base64UrlToBuffer(credential.id),
      };
    });
  }

  return publicKey as unknown as PublicKeyCredentialCreationOptions;
}

export function toPublicKeyRequestOptions(options: JsonRecord) {
  const publicKey = { ...unwrapPublicKeyOptions(options) } as JsonRecord;

  if (typeof publicKey.challenge === "string") {
    publicKey.challenge = base64UrlToBuffer(publicKey.challenge);
  }

  if (Array.isArray(publicKey.allowCredentials)) {
    publicKey.allowCredentials = publicKey.allowCredentials.map((credential) => {
      if (!isRecord(credential) || typeof credential.id !== "string") {
        return credential;
      }

      return {
        ...credential,
        id: base64UrlToBuffer(credential.id),
      };
    });
  }

  return publicKey as unknown as PublicKeyCredentialRequestOptions;
}

export function credentialToJson(credential: PublicKeyCredential) {
  const response = credential.response;
  const json: JsonRecord = {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment,
    clientExtensionResults: credential.getClientExtensionResults(),
  };

  if (response instanceof AuthenticatorAttestationResponse) {
    json.response = {
      attestationObject: bufferToBase64Url(response.attestationObject),
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      transports: response.getTransports?.() ?? [],
    };
  } else if (response instanceof AuthenticatorAssertionResponse) {
    json.response = {
      authenticatorData: bufferToBase64Url(response.authenticatorData),
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      signature: bufferToBase64Url(response.signature),
      userHandle: bufferToBase64Url(response.userHandle),
    };
  }

  return json;
}

export function formatPasskeyError(error: unknown, action: "login" | "register") {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("NotAllowedError")) {
    return action === "login"
      ? "Passkey sign-in was cancelled or no matching passkey was found."
      : "Passkey creation was cancelled.";
  }

  if (message.includes("InvalidStateError")) {
    return "This browser already has a passkey for this account.";
  }

  if (message.includes("SecurityError")) {
    return "This passkey domain does not match the current site. Check the BFF passkey domain allowlist.";
  }

  return message || (action === "login" ? "Could not sign in with passkey." : "Could not add passkey.");
}

export function isDuplicatePasskeyError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  return message.includes("InvalidStateError");
}
