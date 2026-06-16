export type AuthUser = {
  id: string;
  loginName: string;
  displayName?: string | null;
  email?: string | null;
};

export type AppSession = {
  token: string;
  user: AuthUser;
  zitadelSessionId: string;
  zitadelSessionToken: string;
  createdAt: string;
};

export type LoginBody = {
  loginName?: string;
  password?: string;
};

export type PasswordResetRequestBody = {
  loginName?: string;
  redirectUrl?: string;
};

export type PasswordResetConfirmBody = {
  resetRequestId?: string;
  userId?: string;
  code?: string;
  newPassword?: string;
};

export type PasskeyRegisterStartBody = {
  authenticator?: 'platform' | 'crossPlatform' | 'unspecified';
  domain?: string;
};

export type PasskeyRegisterVerifyBody = {
  passkeyId?: string;
  publicKeyCredential?: Record<string, unknown>;
  passkeyName?: string;
};

export type PasskeyLoginStartBody = {
  loginName?: string;
  domain?: string;
};

export type PasskeyLoginVerifyBody = {
  passkeyLoginToken?: string;
  publicKeyCredential?: Record<string, unknown>;
};

export type IdpProvider = 'google' | 'apple';

export type IdpStartBody = {
  provider?: IdpProvider;
  redirectUrl?: string;
};

export type IdpCompleteBody = {
  idpIntentId?: string;
  idpIntentToken?: string;
  provider?: IdpProvider;
  pendingLinkToken?: string;
  linkPending?: boolean;
};

export type ZitadelCreateSessionResponse = {
  sessionId: string;
  sessionToken: string;
};

export type ZitadelCreateIdpIntentResponse = {
  authUrl: string;
};

export type ZitadelRetrieveIdpIntentResponse = {
  details?: {
    resourceOwner?: string;
  };
  idpInformation?: {
    idpId?: string;
    userId?: string;
    userName?: string;
    rawInformation?: Record<string, unknown>;
  };
  userId?: string;
  addHumanUser?: Record<string, unknown>;
  createUser?: {
    organizationId?: string;
    userId?: string;
    username?: string;
    metadata?: unknown[];
    human?: Record<string, unknown>;
  };
};

export type ZitadelCreateUserResponse = {
  id?: string;
  userId?: string;
};

export type ZitadelUpdateSessionResponse = {
  sessionToken: string;
};

export type ZitadelGetSessionResponse = {
  session: {
    id: string;
    factors?: {
      user?: {
        id?: string;
        loginName?: string;
        displayName?: string;
      };
      password?: {
        verifiedAt?: string;
      };
    };
  };
};

export type ZitadelPasswordResetResponse = {
  verificationCode?: string;
};

export type ZitadelRegisterPasskeyResponse = {
  passkeyId: string;
  publicKeyCredentialCreationOptions: Record<string, unknown>;
};

export type ZitadelSessionWebAuthNChallengeResponse = ZitadelCreateSessionResponse & {
  challenges?: {
    webAuthN?: {
      publicKeyCredentialRequestOptions?: Record<string, unknown>;
    };
  };
};

export type PendingIdpLink = {
  idpLink: {
    idpId: string;
    userId: string;
    userName: string;
  };
  email: string | null;
  attemptedProvider: IdpProvider | null;
  requiredProvider: IdpProvider;
  createdAt: number;
};

export type PendingPasskeyLogin = {
  zitadelSessionId: string;
  zitadelSessionToken: string;
  createdAt: number;
};

export class AccountLinkRequiredError extends Error {
  code = 'ACCOUNT_LINK_REQUIRED' as const;

  constructor(
    message: string,
    readonly pendingLinkToken: string,
    readonly attemptedProvider: IdpProvider | null,
    readonly requiredProvider: IdpProvider,
    readonly email: string | null
  ) {
    super(message);
  }
}
