import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const bffBaseUrl =
  process.env.EXPO_PUBLIC_BFF_URL ??
  (Platform.OS === 'web' || !Device.isDevice ? 'http://localhost:8787' : 'http://192.168.1.105:8787');
const socialRedirectUrl = Linking.createURL('auth/idp/callback');
const passwordResetRedirectUrl = Linking.createURL('password/reset');

WebBrowser.maybeCompleteAuthSession();

const sessionKeys = {
  token: 'zitadel-custom-auth.bff_session_token',
  user: 'zitadel-custom-auth.user',
};

async function getStoredItem(key: string) {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function setStoredItem(key: string, value: string) {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteStoredItem(key: string) {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

type AuthUser = {
  id: string;
  loginName: string;
  displayName?: string | null;
  email?: string | null;
};

type LoginResponse = {
  sessionToken: string;
  user: AuthUser;
};

type AccountLinkRequiredResponse = {
  code: 'ACCOUNT_LINK_REQUIRED';
  message: string;
  pendingLinkToken: string;
  attemptedProvider: SocialProvider | null;
  requiredProvider: SocialProvider;
  email?: string | null;
};

type IdpStartResponse = {
  authUrl: string;
};

type PasskeyRegisterStartResponse = {
  passkeyId: string;
  publicKeyCredentialCreationOptions: Record<string, unknown>;
};

type PasskeyLoginStartResponse = {
  passkeyLoginToken: string;
  publicKeyCredentialRequestOptions: Record<string, unknown>;
};

type PasswordResetMode = 'login' | 'request' | 'confirm';

type SocialProvider = 'google' | 'apple';
type PasskeyAction = 'register' | 'login';

type StoredSession = {
  token: string | null;
  user: AuthUser | null;
};

class ApiResponseError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly data: unknown
  ) {
    super(message);
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.text();
  const data = body ? JSON.parse(body) : null;

  if (!response.ok) {
    throw new ApiResponseError(
      data?.message ?? data?.error ?? `Request failed with status ${response.status}.`,
      response.status,
      data
    );
  }

  return data as T;
}

export default function HomeScreen() {
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [resetMode, setResetMode] = useState<PasswordResetMode>('login');
  const [resetLoginName, setResetLoginName] = useState('');
  const [resetRequestId, setResetRequestId] = useState('');
  const [resetUserId, setResetUserId] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [session, setSession] = useState<StoredSession>({ token: null, user: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [socialProvider, setSocialProvider] = useState<SocialProvider | null>(null);
  const [passkeyAction, setPasskeyAction] = useState<PasskeyAction | null>(null);
  const [pendingLink, setPendingLink] = useState<AccountLinkRequiredResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const linkingUrl = Linking.useURL();

  const isLoggedIn = Boolean(session.token);
  const isResettingPassword = resetMode !== 'login';
  const canSubmit = useMemo(
    () => loginName.trim().length > 0 && password.length > 0 && !isBusy,
    [isBusy, loginName, password]
  );
  const canSubmitPasskeyLogin = loginName.trim().length > 0 && !isBusy;
  const canRequestPasswordReset = resetLoginName.trim().length > 0 && !isBusy;
  const canConfirmPasswordReset =
    (resetUserId.trim().length > 0 || resetRequestId.trim().length > 0) &&
    resetCode.trim().length > 0 &&
    newPassword.length > 0 &&
    !isBusy;

  const storeSession = useCallback(async (nextSession: StoredSession) => {
    await Promise.all([
      nextSession.token
        ? setStoredItem(sessionKeys.token, nextSession.token)
        : deleteStoredItem(sessionKeys.token),
      nextSession.user
        ? setStoredItem(sessionKeys.user, JSON.stringify(nextSession.user))
        : deleteStoredItem(sessionKeys.user),
    ]);

    setSession(nextSession);
  }, []);

  const loadStoredSession = useCallback(async () => {
    const [token, userJson] = await Promise.all([
      getStoredItem(sessionKeys.token),
      getStoredItem(sessionKeys.user),
    ]);

    setSession({
      token,
      user: userJson ? (JSON.parse(userJson) as AuthUser) : null,
    });
  }, []);

  useEffect(() => {
    loadStoredSession()
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : 'Could not load saved session.');
      })
      .finally(() => setIsLoading(false));
  }, [loadStoredSession]);

  useEffect(() => {
    if (!linkingUrl) {
      return;
    }

    const resetParams = parsePasswordResetParams(linkingUrl);

    if (!resetParams.userId || !resetParams.code) {
      return;
    }

    setResetUserId(resetParams.userId);
    setResetCode(resetParams.code);
    setResetMode('confirm');
    setErrorMessage(null);
    setInfoMessage('Enter a new password to finish the reset.');
  }, [linkingUrl]);

  const showResetRequest = () => {
    setResetLoginName(loginName);
    setResetMode('request');
    setErrorMessage(null);
    setInfoMessage(null);
  };

  const showLogin = () => {
    setResetMode('login');
    setResetRequestId('');
    setResetUserId('');
    setResetCode('');
    setNewPassword('');
    setErrorMessage(null);
    setInfoMessage(null);
  };

  const login = async () => {
    setIsBusy(true);
    setErrorMessage(null);

    try {
      const data = await fetch(`${bffBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loginName: loginName.trim(),
          password,
        }),
      }).then((response) => parseJsonResponse<LoginResponse>(response));

      await storeSession({
        token: data.sessionToken,
        user: data.user,
      });
      setPassword('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not sign in.');
    } finally {
      setIsBusy(false);
    }
  };

  const requestPasswordReset = async () => {
    setIsBusy(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const data = await fetch(`${bffBaseUrl}/auth/password-reset/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loginName: resetLoginName.trim(),
          redirectUrl: passwordResetRedirectUrl,
        }),
      }).then((response) => parseJsonResponse<{ message?: string; resetRequestId?: string }>(response));

      setResetRequestId(data.resetRequestId ?? '');
      setInfoMessage(data.message ?? 'If that account exists, a password reset link has been sent.');
      setResetMode('confirm');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not request password reset.');
    } finally {
      setIsBusy(false);
    }
  };

  const confirmPasswordReset = async () => {
    setIsBusy(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      await fetch(`${bffBaseUrl}/auth/password-reset/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resetRequestId: resetRequestId.trim(),
          userId: resetUserId.trim(),
          code: resetCode.trim(),
          newPassword,
        }),
      }).then((response) => parseJsonResponse<{ ok: true }>(response));

      setLoginName(resetLoginName);
      setPassword('');
      setResetRequestId('');
      setResetUserId('');
      setResetCode('');
      setNewPassword('');
      setResetMode('login');
      setInfoMessage('Password reset. You can log in with the new password.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not reset password.');
    } finally {
      setIsBusy(false);
    }
  };

  const loginWithProvider = async (
    provider: SocialProvider,
    options: {
      pendingLinkToken?: string;
      linkPending?: boolean;
    } = {}
  ) => {
    setIsBusy(true);
    setSocialProvider(provider);
    setErrorMessage(null);

    try {
      const start = await fetch(`${bffBaseUrl}/auth/idp/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          redirectUrl: socialRedirectUrl,
        }),
      }).then((response) => parseJsonResponse<IdpStartResponse>(response));

      const result = await WebBrowser.openAuthSessionAsync(start.authUrl, socialRedirectUrl);

      if (result.type !== 'success') {
        throw new Error('Social login was cancelled.');
      }

      const callbackParams = parseSocialCallbackParams(result.url);

      if (callbackParams.error) {
        throw new Error(callbackParams.error);
      }

      if (!callbackParams.idpIntentId || !callbackParams.idpIntentToken) {
        throw new Error('ZITADEL did not return the expected social login callback parameters.');
      }

      const data = await fetch(`${bffBaseUrl}/auth/idp/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...callbackParams,
          provider,
          pendingLinkToken: options.pendingLinkToken,
          linkPending: options.linkPending,
        }),
      }).then((response) => parseJsonResponse<LoginResponse>(response));

      await storeSession({
        token: data.sessionToken,
        user: data.user,
      });
      setPendingLink(null);
    } catch (error) {
      if (isAccountLinkRequiredError(error)) {
        setPendingLink(error.data);
        setErrorMessage(null);
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : `Could not sign in with ${provider}.`);
    } finally {
      setSocialProvider(null);
      setIsBusy(false);
    }
  };

  const registerPasskey = async () => {
    if (!session.token) {
      setErrorMessage('Log in before adding a passkey.');
      return;
    }

    setIsBusy(true);
    setPasskeyAction('register');
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const passkeys = await getPasskeysModule();

      if (!passkeys.isSupported()) {
        throw new Error('Passkeys are not supported in this app build or on this device.');
      }

      const start = await fetch(`${bffBaseUrl}/auth/passkeys/register/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authenticator: 'platform',
        }),
      }).then((response) => parseJsonResponse<PasskeyRegisterStartResponse>(response));

      const credential = await passkeys.create(
        unwrapPublicKeyOptions(start.publicKeyCredentialCreationOptions) as Parameters<typeof passkeys.create>[0]
      );

      if (!credential) {
        throw new Error('Passkey registration was cancelled.');
      }

      await fetch(`${bffBaseUrl}/auth/passkeys/register/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passkeyId: start.passkeyId,
          publicKeyCredential: credential,
          passkeyName: Device.modelName ? `${Device.modelName} passkey` : 'Mobile passkey',
        }),
      }).then((response) => parseJsonResponse<{ ok: true }>(response));

      setInfoMessage('Passkey added. You can use it next time you sign in.');
    } catch (error) {
      setErrorMessage(formatPasskeyError(error, 'register'));
    } finally {
      setPasskeyAction(null);
      setIsBusy(false);
    }
  };

  const loginWithPasskey = async () => {
    setIsBusy(true);
    setPasskeyAction('login');
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const passkeys = await getPasskeysModule();

      if (!passkeys.isSupported()) {
        throw new Error('Passkeys are not supported in this app build or on this device.');
      }

      const start = await fetch(`${bffBaseUrl}/auth/passkeys/login/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loginName: loginName.trim(),
        }),
      }).then((response) => parseJsonResponse<PasskeyLoginStartResponse>(response));

      const credential = await passkeys.get(
        unwrapPublicKeyOptions(start.publicKeyCredentialRequestOptions) as Parameters<typeof passkeys.get>[0]
      );

      if (!credential) {
        throw new Error('Passkey login was cancelled.');
      }

      const data = await fetch(`${bffBaseUrl}/auth/passkeys/login/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passkeyLoginToken: start.passkeyLoginToken,
          publicKeyCredential: credential,
        }),
      }).then((response) => parseJsonResponse<LoginResponse>(response));

      await storeSession({
        token: data.sessionToken,
        user: data.user,
      });
      setPassword('');
    } catch (error) {
      setErrorMessage(formatPasskeyError(error, 'login'));
    } finally {
      setPasskeyAction(null);
      setIsBusy(false);
    }
  };

  const logout = async () => {
    setIsBusy(true);
    setErrorMessage(null);

    try {
      if (session.token) {
        await fetch(`${bffBaseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        });
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not notify the BFF.');
    } finally {
      await storeSession({ token: null, user: null });
      setIsBusy(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: 12, default: 0 })}
        style={styles.keyboardView}>
        <ScrollView
          alwaysBounceVertical={false}
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Custom Auth</Text>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>
              The app collects credentials and sends them to the Hono BFF. The BFF talks to ZITADEL.
            </Text>
          </View>

          <View style={styles.panel}>
            <View style={styles.row}>
              <Text style={styles.label}>Status</Text>
              <Text style={[styles.status, isLoggedIn ? styles.statusSignedIn : styles.statusSignedOut]}>
                {isLoggedIn ? 'Logged in' : 'Logged out'}
              </Text>
            </View>

            <View style={styles.detailBlock}>
              <Text style={styles.label}>BFF</Text>
              <Text style={styles.mono}>{bffBaseUrl}</Text>
            </View>

            {isLoggedIn ? (
              <View style={styles.detailBlock}>
                <Text style={styles.label}>User</Text>
                <Text style={styles.userName}>
                  {session.user?.displayName || session.user?.email || session.user?.loginName}
                </Text>
              </View>
            ) : resetMode === 'request' ? (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email or username</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    onChangeText={setResetLoginName}
                    placeholder="name@example.com"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    textContentType="username"
                    value={resetLoginName}
                  />
                </View>
              </View>
            ) : resetMode === 'confirm' ? (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Reset code</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={setResetCode}
                    placeholder="Code from email link"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    value={resetCode}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New password</Text>
                  <TextInput
                    onChangeText={setNewPassword}
                    placeholder="New password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    style={styles.input}
                    textContentType="newPassword"
                    value={newPassword}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email or username</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    onChangeText={setLoginName}
                    placeholder="name@example.com"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    textContentType="username"
                    value={loginName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    style={styles.input}
                    textContentType="password"
                    value={password}
                  />
                </View>
                <Pressable disabled={isBusy} onPress={showResetRequest} style={styles.textButton}>
                  <Text style={styles.textButtonText}>Forgot password?</Text>
                </Pressable>
              </View>
            )}

            {infoMessage ? <Text style={styles.info}>{infoMessage}</Text> : null}
            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

            {isLoggedIn ? (
              <View style={styles.authenticatedActions}>
                <Pressable
                  disabled={isBusy}
                  onPress={registerPasskey}
                  style={({ pressed }) => [
                    styles.button,
                    (pressed || passkeyAction === 'register') && styles.buttonPressed,
                  ]}>
                  <Text style={styles.buttonText}>
                    {passkeyAction === 'register' ? 'Adding passkey...' : 'Add passkey'}
                  </Text>
                </Pressable>
                <Pressable
                  disabled={isBusy}
                  onPress={logout}
                  style={({ pressed }) => [
                    styles.button,
                    styles.secondaryButton,
                    (pressed || isBusy) && styles.buttonPressed,
                  ]}>
                  <Text style={styles.secondaryButtonText}>{isBusy ? 'Signing out...' : 'Logout'}</Text>
                </Pressable>
              </View>
            ) : resetMode === 'request' ? (
              <Pressable
                disabled={!canRequestPasswordReset}
                onPress={requestPasswordReset}
                style={({ pressed }) => [
                  styles.button,
                  !canRequestPasswordReset && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}>
                <Text style={styles.buttonText}>{isBusy ? 'Sending...' : 'Send reset link'}</Text>
              </Pressable>
            ) : resetMode === 'confirm' ? (
              <Pressable
                disabled={!canConfirmPasswordReset}
                onPress={confirmPasswordReset}
                style={({ pressed }) => [
                  styles.button,
                  !canConfirmPasswordReset && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}>
                <Text style={styles.buttonText}>{isBusy ? 'Resetting...' : 'Reset password'}</Text>
              </Pressable>
            ) : (
              <Pressable
                disabled={!canSubmit}
                onPress={login}
                style={({ pressed }) => [
                  styles.button,
                  !canSubmit && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}>
                <Text style={styles.buttonText}>{isBusy ? 'Signing in...' : 'Login'}</Text>
              </Pressable>
            )}

            {isResettingPassword ? (
              <Pressable disabled={isBusy} onPress={showLogin} style={styles.secondaryTextButton}>
                <Text style={styles.textButtonText}>Back to login</Text>
              </Pressable>
            ) : null}

            {pendingLink && !isLoggedIn && !isResettingPassword ? (
              <View style={styles.linkPanel}>
                <Text style={styles.linkText}>{pendingLink.message}</Text>
                <Pressable
                  disabled={isBusy}
                  onPress={() => loginWithProvider(pendingLink.requiredProvider)}
                  style={({ pressed }) => [styles.socialButton, (pressed || isBusy) && styles.buttonPressed]}>
                  <Text style={styles.socialButtonText}>
                    {socialProvider === pendingLink.requiredProvider
                      ? `Opening ${providerLabel(pendingLink.requiredProvider)}...`
                      : `Sign in with ${providerLabel(pendingLink.requiredProvider)}`}
                  </Text>
                </Pressable>
                <Pressable
                  disabled={isBusy}
                  onPress={() =>
                    loginWithProvider(pendingLink.requiredProvider, {
                      pendingLinkToken: pendingLink.pendingLinkToken,
                      linkPending: true,
                    })
                  }
                  style={({ pressed }) => [styles.button, (pressed || isBusy) && styles.buttonPressed]}>
                  <Text style={styles.buttonText}>
                    {socialProvider === pendingLink.requiredProvider
                      ? `Opening ${providerLabel(pendingLink.requiredProvider)}...`
                      : `Sign in with ${providerLabel(pendingLink.requiredProvider)} and link ${providerLabel(
                          pendingLink.attemptedProvider ?? 'apple'
                        )}`}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {!isLoggedIn && !isResettingPassword && !pendingLink ? (
              <View style={styles.socialActions}>
                <Pressable
                  disabled={!canSubmitPasskeyLogin}
                  onPress={loginWithPasskey}
                  style={({ pressed }) => [
                    styles.socialButton,
                    !canSubmitPasskeyLogin && styles.buttonDisabled,
                    (pressed || passkeyAction === 'login') && styles.buttonPressed,
                  ]}>
                  <Text style={styles.socialButtonText}>
                    {passkeyAction === 'login' ? 'Opening passkey...' : 'Continue with passkey'}
                  </Text>
                </Pressable>
                <Pressable
                  disabled={isBusy}
                  onPress={() => loginWithProvider('google')}
                  style={({ pressed }) => [styles.socialButton, (pressed || isBusy) && styles.buttonPressed]}>
                  <Text style={styles.socialButtonText}>
                    {socialProvider === 'google' ? 'Opening Google...' : 'Continue with Google'}
                  </Text>
                </Pressable>
                <Pressable
                  disabled={isBusy}
                  onPress={() => loginWithProvider('apple')}
                  style={({ pressed }) => [styles.socialButton, (pressed || isBusy) && styles.buttonPressed]}>
                  <Text style={styles.socialButtonText}>
                    {socialProvider === 'apple' ? 'Opening Apple...' : 'Continue with Apple'}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function parseSocialCallbackParams(callbackUrl: string) {
  const url = new URL(callbackUrl);
  const params = getCallbackParams(url);

  return {
    idpIntentId:
      getFirstParam(params, ['idpIntentId', 'idp_intent_id', 'idpIntentID', 'intentId', 'intent_id', 'id']) ??
      undefined,
    idpIntentToken:
      getFirstParam(params, ['idpIntentToken', 'idp_intent_token', 'idpToken', 'idp_token', 'token']) ?? undefined,
    error:
      getFirstParam(params, ['error_description', 'errorDescription', 'error']) ?? getFirstParam(params, ['message']),
  };
}

function parsePasswordResetParams(callbackUrl: string) {
  const url = new URL(callbackUrl);
  const params = getCallbackParams(url);

  return {
    userId: getFirstParam(params, ['userID', 'userId', 'user_id']) ?? undefined,
    code: getFirstParam(params, ['code', 'verificationCode', 'verification_code']) ?? undefined,
  };
}

function isAccountLinkRequiredError(error: unknown): error is ApiResponseError & { data: AccountLinkRequiredResponse } {
  return (
    error instanceof ApiResponseError &&
    error.status === 409 &&
    isRecord(error.data) &&
    error.data.code === 'ACCOUNT_LINK_REQUIRED' &&
    typeof error.data.pendingLinkToken === 'string' &&
    (error.data.requiredProvider === 'google' || error.data.requiredProvider === 'apple')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function providerLabel(provider: SocialProvider) {
  return provider === 'google' ? 'Google' : 'Apple';
}

async function getPasskeysModule() {
  return import('react-native-passkeys');
}

function unwrapPublicKeyOptions(options: Record<string, unknown>) {
  return isRecord(options.publicKey) ? options.publicKey : options;
}

function formatPasskeyError(error: unknown, action: PasskeyAction) {
  const message = error instanceof Error ? error.message : '';

  if (message.includes('AuthorizationError error 1006')) {
    return action === 'register'
      ? 'This device already has a passkey for this account.'
      : 'No matching passkey was found for this account on this device.';
  }

  return message || (action === 'register' ? 'Could not add passkey.' : 'Could not sign in with passkey.');
}

function getCallbackParams(url: URL) {
  const params = new URLSearchParams(url.search);

  if (url.hash) {
    const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
    const hashParams = new URLSearchParams(hash.startsWith('?') ? hash.slice(1) : hash);

    hashParams.forEach((value, key) => {
      params.set(key, value);
    });
  }

  return params;
}

function getFirstParam(params: URLSearchParams, keys: string[]) {
  for (const key of keys) {
    const value = params.get(key);

    if (value) {
      return value;
    }
  }

  return null;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F8FAFC',
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 48,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    gap: 8,
    marginBottom: 28,
    marginTop: 24,
  },
  eyebrow: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: '#0F172A',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0,
  },
  subtitle: {
    color: '#475569',
    fontSize: 16,
    lineHeight: 24,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 18,
    padding: 20,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  label: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  status: {
    borderRadius: 999,
    fontSize: 14,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusSignedIn: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  statusSignedOut: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
  },
  detailBlock: {
    gap: 8,
  },
  mono: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 6,
    borderWidth: 1,
    color: '#0F172A',
    fontFamily: 'Courier',
    fontSize: 13,
    lineHeight: 20,
    padding: 12,
  },
  userName: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderRadius: 6,
    borderWidth: 1,
    color: '#166534',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    padding: 12,
  },
  form: {
    gap: 14,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 8,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  error: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderRadius: 6,
    borderWidth: 1,
    color: '#991B1B',
    lineHeight: 20,
    padding: 12,
  },
  info: {
    backgroundColor: '#DBEAFE',
    borderColor: '#60A5FA',
    borderRadius: 6,
    borderWidth: 1,
    color: '#1E3A8A',
    lineHeight: 20,
    padding: 12,
  },
  textButton: {
    alignSelf: 'flex-start',
    minHeight: 28,
    justifyContent: 'center',
  },
  secondaryTextButton: {
    alignItems: 'center',
    minHeight: 32,
    justifyContent: 'center',
  },
  textButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 18,
  },
  secondaryButton: {
    backgroundColor: '#0F172A',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  socialActions: {
    gap: 10,
  },
  authenticatedActions: {
    gap: 10,
  },
  linkPanel: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  linkText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  socialButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 16,
  },
  socialButtonText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
