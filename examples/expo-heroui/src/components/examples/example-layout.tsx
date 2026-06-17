import { Feather } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import {
  Card,
  Chip,
  Separator,
  Surface,
  cn,
  useThemeColor,
} from 'heroui-native';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { withUniwind } from 'uniwind';
import { AppText } from '../app-text';
import { ScreenScrollView } from '../screen-scroll-view';

const StyledFeather = withUniwind(Feather);

type IconName = ComponentProps<typeof Feather>['name'];

export type ExampleRoute = {
  title: string;
  description: string;
  href: Href;
  icon: IconName;
  badge: string;
};

export function ExampleScreen({
  children,
  eyebrow,
  title,
  description,
}: {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <ScreenScrollView contentContainerClassName="gap-5">
      <View className="gap-2">
        {eyebrow ? (
          <AppText className="text-xs uppercase text-muted font-semibold">
            {eyebrow}
          </AppText>
        ) : null}
        <AppText className="text-3xl text-foreground font-bold">
          {title}
        </AppText>
        <AppText className="text-base text-muted leading-6">
          {description}
        </AppText>
      </View>
      {children}
    </ScreenScrollView>
  );
}

export function ExampleSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Surface className="gap-4 p-4">
      <View className="gap-1">
        <AppText className="text-lg text-foreground font-semibold">
          {title}
        </AppText>
        {description ? (
          <AppText className="text-sm text-muted leading-5">
            {description}
          </AppText>
        ) : null}
      </View>
      <Separator />
      <View className="gap-4">{children}</View>
    </Surface>
  );
}

export function ExampleRouteCard({
  route,
  index,
}: {
  route: ExampleRoute;
  index: number;
}) {
  const router = useRouter();
  const accent = useThemeColor('accent');

  return (
    <Pressable onPress={() => router.push(route.href)}>
      <Card className="p-4 shadow-none border border-border">
        <View className="flex-row gap-4 items-start">
          <View
            className="size-11 rounded-2xl items-center justify-center"
            style={{ backgroundColor: `${accent}18` }}
          >
            <StyledFeather name={route.icon} size={20} className="text-accent" />
          </View>
          <View className="flex-1 gap-2">
            <View className="flex-row items-start gap-3">
              <View className="flex-1">
                <Card.Title className="text-xl">{route.title}</Card.Title>
                <Card.Description className="leading-5">
                  {route.description}
                </Card.Description>
              </View>
              <Chip size="sm" variant="secondary">
                <Chip.Label>{route.badge}</Chip.Label>
              </Chip>
            </View>
            <View className="flex-row items-center justify-between">
              <AppText className="text-xs text-muted">
                Example {index + 1}
              </AppText>
              <StyledFeather
                name="arrow-right"
                size={18}
                className="text-muted"
              />
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export function Swatch({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <View className="gap-2 flex-1 min-w-24">
      <View className={cn('h-14 rounded-xl border border-border', className)} />
      <AppText className="text-xs text-muted">{label}</AppText>
    </View>
  );
}
