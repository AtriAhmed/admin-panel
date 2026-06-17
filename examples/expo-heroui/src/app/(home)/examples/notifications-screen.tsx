import { Feather } from '@expo/vector-icons';
import { Button, Card, Chip, Surface, useToast } from 'heroui-native';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { withUniwind } from 'uniwind';
import { AppText } from '../../../components/app-text';
import { ScreenScrollView } from '../../../components/screen-scroll-view';

const StyledFeather = withUniwind(Feather);

type NotificationTone = 'primary' | 'tertiary' | 'secondary';

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: keyof typeof Feather.glyphMap;
  tone: NotificationTone;
  unread: boolean;
};

const initialNotifications: NotificationItem[] = [
  {
    id: 'friend-request',
    title: 'New Friend Request',
    description:
      'Alex Rivera wants to connect with you. View their profile to accept.',
    time: '2m ago',
    icon: 'user',
    tone: 'primary',
    unread: true,
  },
  {
    id: 'payment',
    title: 'Payment Successful',
    description:
      'Your premium subscription has been renewed successfully for $14.99.',
    time: '15m ago',
    icon: 'credit-card',
    tone: 'tertiary',
    unread: true,
  },
  {
    id: 'system-update',
    title: 'System Update',
    description:
      'Version 2.4.0 is now available. Bug fixes and performance improvements.',
    time: '2h ago',
    icon: 'download-cloud',
    tone: 'secondary',
    unread: false,
  },
  {
    id: 'security',
    title: 'Security Alert',
    description:
      'Your password was successfully changed from a new device in San Francisco.',
    time: '5h ago',
    icon: 'shield',
    tone: 'secondary',
    unread: false,
  },
  {
    id: 'digest',
    title: 'Weekly Digest',
    description:
      'Check out your activity stats from the past week. You were 15% more active.',
    time: 'Yesterday',
    icon: 'radio',
    tone: 'secondary',
    unread: false,
  },
];

function toneClasses(tone: NotificationTone) {
  if (tone === 'primary') {
    return {
      background: 'bg-accent/10',
      icon: 'text-accent',
    };
  }

  if (tone === 'tertiary') {
    return {
      background: 'bg-sky-500/10',
      icon: 'text-sky-700',
    };
  }

  return {
    background: 'bg-muted/10',
    icon: 'text-muted',
  };
}

function NotificationCard({
  item,
  onRead,
}: {
  item: NotificationItem;
  onRead: (id: string) => void;
}) {
  const tone = toneClasses(item.tone);

  return (
    <Pressable onPress={() => onRead(item.id)}>
      <Card
        className={`rounded-xl p-4 shadow-none overflow-hidden ${
          item.unread
            ? 'border border-border bg-background'
            : 'border border-transparent bg-surface opacity-80'
        }`}
      >
        {item.unread ? (
          <View className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
        ) : null}
        <View className="flex-row items-start gap-4">
          <View
            className={`size-12 rounded-full items-center justify-center ${tone.background}`}
          >
            <StyledFeather name={item.icon} size={20} className={tone.icon} />
          </View>

          <View className="flex-1 gap-2">
            <View className="flex-row items-start justify-between gap-3">
              <AppText
                className={`text-base text-foreground flex-1 ${
                  item.unread ? 'font-semibold' : 'font-medium'
                }`}
              >
                {item.title}
              </AppText>
              <AppText
                className={`text-xs font-medium ${
                  item.unread ? 'text-accent' : 'text-muted'
                }`}
              >
                {item.time}
              </AppText>
            </View>
            <AppText className="text-sm text-muted leading-5">
              {item.description}
            </AppText>
            {item.unread ? <View className="size-2 rounded-full bg-accent" /> : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function NotificationSection({
  title,
  items,
  onRead,
}: {
  title: string;
  items: NotificationItem[];
  onRead: (id: string) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View className="gap-3">
      <AppText className="text-xs text-muted uppercase tracking-widest font-semibold">
        {title}
      </AppText>
      <View className="gap-3">
        {items.map((item) => (
          <NotificationCard key={item.id} item={item} onRead={onRead} />
        ))}
      </View>
    </View>
  );
}

export default function NotificationsScreenExample() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const { toast } = useToast();

  const unread = useMemo(
    () => notifications.filter((item) => item.unread),
    [notifications]
  );

  const earlier = useMemo(
    () => notifications.filter((item) => !item.unread),
    [notifications]
  );

  const markOneRead = (id: string) => {
    const notification = notifications.find((item) => item.id === id);

    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, unread: false } : item
      )
    );

    if (notification?.unread) {
      toast.show({
        variant: 'success',
        label: 'Marked as read',
        description: notification.title,
        actionLabel: 'Close',
        onActionPress: ({ hide }) => hide(),
      });
    }
  };

  const markAllRead = () => {
    const unreadCount = unread.length;

    setNotifications((current) =>
      current.map((item) => ({ ...item, unread: false }))
    );

    if (unreadCount > 0) {
      toast.show({
        variant: 'success',
        label: 'Notifications updated',
        description: `${unreadCount} notification${
          unreadCount === 1 ? '' : 's'
        } marked as read.`,
        actionLabel: 'Close',
        onActionPress: ({ hide }) => hide(),
      });
    }
  };

  return (
    <ScreenScrollView
      className="bg-background"
      contentContainerClassName="gap-6 px-5"
    >
      <View className="gap-4">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1 gap-2">
            <View className="flex-row items-start gap-2">
              <AppText className="text-3xl text-foreground font-bold">
                Notifications
              </AppText>
              {unread.length > 0 ? (
                <Chip size="sm" color="accent" className="mt-1">
                  <Chip.Label>{unread.length} new</Chip.Label>
                </Chip>
              ) : null}
            </View>
            <AppText className="text-base text-muted leading-6">
              Activity updates, payments, account alerts, and product messages.
            </AppText>
          </View>

          <Button
            variant="tertiary"
            className="bg-transparent px-0"
            isDisabled={unread.length === 0}
            onPress={markAllRead}
          >
            <Button.Label className="text-accent text-sm">
              {unread.length === 0 ? 'All Read' : 'Mark all'}
            </Button.Label>
          </Button>
        </View>
      </View>

      <NotificationSection title="New" items={unread} onRead={markOneRead} />

      <Surface className="rounded-xl bg-accent p-5 overflow-hidden">
        <View className="gap-4">
          <View className="gap-1">
            <AppText className="text-2xl text-accent-foreground font-bold">
              Unlock Rewards
            </AppText>
            <AppText className="text-sm text-accent-foreground/90 leading-5">
              Complete your profile to unlock exclusive member badges and
              rewards.
            </AppText>
          </View>
          <Button variant="secondary" className="self-start rounded-full">
            <Button.Label className="text-accent">Get Started</Button.Label>
          </Button>
        </View>
        <StyledFeather
          name="star"
          size={96}
          className="absolute -right-4 -bottom-5 text-accent-foreground/20"
        />
      </Surface>

      <NotificationSection
        title="Earlier"
        items={earlier}
        onRead={markOneRead}
      />
    </ScreenScrollView>
  );
}
