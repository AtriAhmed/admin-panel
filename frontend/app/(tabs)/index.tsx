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
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const bffBaseUrl =
  Platform.OS === 'web' || !Device.isDevice ? 'http://localhost:8787' : 'http://192.168.1.100:8787';
const socialRedirectUrl = Linking.createURL('auth/idp/callback');

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

type IdpStartResponse = {
  authUrl: string;
};

type SocialProvider = 'google' | 'apple';

type StoredSession = {
  token: string | null;
  user: AuthUser | null;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.text();
  const data = body ? JSON.parse(body) : null;

  if (!response.ok) {
    throw new Error(data?.message ?? data?.error ?? `Request failed with status ${response.status}.`);
  }

  return data as T;
}

export default function HomeScreen() {
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<StoredSession>({ token: null, user: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [socialProvider, setSocialProvider] = useState<SocialProvider | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLoggedIn = Boolean(session.token);
  const canSubmit = useMemo(
    () => loginName.trim().length > 0 && password.length > 0 && !isBusy,
    [isBusy, loginName, password]
  );

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

  const loginWithProvider = async (provider: SocialProvider) => {
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
        body: JSON.stringify(callbackParams),
      }).then((response) => parseJsonResponse<LoginResponse>(response));

      await storeSession({
        token: data.sessionToken,
        user: data.user,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : `Could not sign in with ${provider}.`);
    } finally {
      setSocialProvider(null);
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
        style={styles.keyboardView}>
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
            </View>
          )}

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          {isLoggedIn ? (
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

          {!isLoggedIn ? (
            <View style={styles.socialActions}>
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
    userId: getFirstParam(params, ['userId', 'user_id', 'user']) ?? undefined,
    error:
      getFirstParam(params, ['error_description', 'errorDescription', 'error']) ?? getFirstParam(params, ['message']),
  };
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
    padding: 24,
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
