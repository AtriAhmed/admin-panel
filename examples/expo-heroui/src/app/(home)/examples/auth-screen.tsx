import { Feather, FontAwesome } from '@expo/vector-icons';
import {
  Button,
  InputGroup,
  Label,
  Separator,
  Surface,
  TextField,
} from 'heroui-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { withUniwind } from 'uniwind';
import { AppText } from '../../../components/app-text';
import { EyeIcon } from '../../../components/icons/eye';
import { EyeSlashIcon } from '../../../components/icons/eye-slash';
import { LockIcon } from '../../../components/icons/lock';
import { ScreenScrollView } from '../../../components/screen-scroll-view';

const StyledFeather = withUniwind(Feather);
const StyledFontAwesome = withUniwind(FontAwesome);

function AuthInput({
  icon,
  label,
  placeholder,
  secureTextEntry,
  value,
  onChangeText,
  onToggleSecure,
  isPasswordVisible,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  placeholder: string;
  secureTextEntry?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  onToggleSecure?: () => void;
  isPasswordVisible?: boolean;
}) {
  return (
    <TextField className="gap-2">
      <Label className="ml-1">
        <Label.Text className="text-xs text-muted font-semibold">
          {label}
        </Label.Text>
      </Label>
      <InputGroup>
        <InputGroup.Prefix isDecorative>
          {icon === 'lock' ? (
            <LockIcon size={16} colorClassName="accent-field-placeholder" />
          ) : (
            <StyledFeather
              name={icon}
              size={16}
              className="text-field-placeholder"
            />
          )}
        </InputGroup.Prefix>
        <InputGroup.Input
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          autoCapitalize="none"
          keyboardType={icon === 'mail' ? 'email-address' : 'default'}
        />
        {onToggleSecure ? (
          <InputGroup.Suffix>
            <Pressable onPress={onToggleSecure} hitSlop={20}>
              {isPasswordVisible ? (
                <EyeSlashIcon
                  size={16}
                  colorClassName="accent-field-placeholder"
                />
              ) : (
                <EyeIcon size={16} colorClassName="accent-field-placeholder" />
              )}
            </Pressable>
          </InputGroup.Suffix>
        ) : null}
      </InputGroup>
    </TextField>
  );
}

function SocialButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="secondary"
      className="flex-1 h-14 rounded-xl bg-background border border-border"
    >
      {children}
      <Button.Label className="text-foreground">{label}</Button.Label>
    </Button>
  );
}

export default function AuthScreenExample() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <ScreenScrollView
      contentContainerClassName="flex-grow justify-between px-5"
      className="bg-background"
    >
      <View className="gap-8">
        <View className="gap-2 pt-8">
          <AppText className="text-3xl text-foreground font-bold">
            Welcome Back
          </AppText>
          <AppText className="text-base text-muted">
            Please sign in to continue
          </AppText>
        </View>

        <View className="gap-6">
          <AuthInput
            icon="mail"
            label="Email"
            placeholder="hello@example.com"
            value={email}
            onChangeText={setEmail}
          />

          <View className="gap-3">
            <AuthInput
              icon="lock"
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onToggleSecure={() => setPasswordVisible((current) => !current)}
              isPasswordVisible={passwordVisible}
            />
            <Button variant="tertiary" className="self-end bg-transparent px-0">
              <Button.Label className="text-accent text-sm">
                Forgot Password?
              </Button.Label>
            </Button>
          </View>

          <Button className="h-14 rounded-xl">
            <Button.Label>Sign In</Button.Label>
            <StyledFeather
              name="arrow-right"
              size={18}
              className="text-accent-foreground"
            />
          </Button>

          <View className="flex-row items-center gap-4">
            <Separator className="flex-1" />
            <AppText className="text-xs text-muted font-semibold">
              Or continue with
            </AppText>
            <Separator className="flex-1" />
          </View>

          <View className="flex-row gap-4">
            <SocialButton label="Google">
              <Surface className="size-7 rounded-full items-center justify-center bg-background">
                <AppText className="text-base font-bold text-foreground">
                  G
                </AppText>
              </Surface>
            </SocialButton>
            <SocialButton label="Apple">
              <StyledFontAwesome
                name="apple"
                size={22}
                className="text-foreground"
              />
            </SocialButton>
          </View>
        </View>
      </View>

      <View className="items-center pb-4">
        <AppText className="text-muted text-base">
          Do not have an account?{' '}
          <AppText className="text-accent font-bold">Sign Up</AppText>
        </AppText>
      </View>
    </ScreenScrollView>
  );
}
