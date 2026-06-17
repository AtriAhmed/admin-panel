import { Feather } from '@expo/vector-icons';
import {
  Avatar,
  Button,
  Card,
  Chip,
  Dialog,
  InputGroup,
  Popover,
  Separator,
  Surface,
} from 'heroui-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { withUniwind } from 'uniwind';
import { AppText } from '../../../components/app-text';
import { MagnifierIcon } from '../../../components/icons/magnifier';
import { ScreenScrollView } from '../../../components/screen-scroll-view';

const StyledFeather = withUniwind(Feather);

type UserRole = 'Admin' | 'Editor' | 'Viewer';

type DirectoryUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  initials: string;
  avatar?: string;
};

const users: DirectoryUser[] = [
  {
    id: 'marcus',
    name: 'Marcus Chen',
    email: 'marcus.chen@luminous.com',
    role: 'Admin',
    initials: 'MC',
    avatar: 'https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg',
  },
  {
    id: 'sarah',
    name: 'Sarah Jenkins',
    email: 's.jenkins@design.io',
    role: 'Editor',
    initials: 'SJ',
    avatar:
      'https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/purple.jpg',
  },
  {
    id: 'robert',
    name: 'Robert Johnson',
    email: 'robert.j@corp.net',
    role: 'Viewer',
    initials: 'RJ',
  },
  {
    id: 'david',
    name: 'David Wilson',
    email: 'david.w@techpulse.org',
    role: 'Editor',
    initials: 'DW',
    avatar:
      'https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/green.jpg',
  },
  {
    id: 'eliza',
    name: 'Eliza Thorne',
    email: 'eliza.t@global.io',
    role: 'Admin',
    initials: 'ET',
    avatar: 'https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/red.jpg',
  },
];

function roleColor(role: UserRole) {
  if (role === 'Admin') {
    return 'accent';
  }

  if (role === 'Editor') {
    return 'warning';
  }

  return 'default';
}

function StatCard({
  label,
  value,
  meta,
  isLive,
}: {
  label: string;
  value: string;
  meta?: string;
  isLive?: boolean;
}) {
  return (
    <Card className="flex-1 h-24 p-4 rounded-xl shadow-none border border-border bg-background">
      <View className="flex-1 justify-between">
        <AppText className="text-xs text-muted font-medium">{label}</AppText>
        <View className="flex-row items-baseline gap-2">
          <AppText className="text-2xl text-accent font-bold">{value}</AppText>
          {meta ? (
            <AppText className="text-xs text-success font-semibold">
              {meta}
            </AppText>
          ) : null}
          {isLive ? <View className="size-2 rounded-full bg-success" /> : null}
        </View>
      </View>
    </Card>
  );
}

function UserAction({
  icon,
  label,
  onPress,
  tone = 'default',
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress?: () => void;
  tone?: 'default' | 'danger';
}) {
  return (
    <Button
      variant="tertiary"
      className="self-stretch justify-start bg-transparent px-0"
      onPress={onPress}
    >
      <StyledFeather
        name={icon}
        size={17}
        className={tone === 'danger' ? 'text-danger' : 'text-muted'}
      />
      <Button.Label
        className={tone === 'danger' ? 'text-danger' : 'text-foreground'}
      >
        {label}
      </Button.Label>
    </Button>
  );
}

function UserActionsPopover({ user }: { user: DirectoryUser }) {
  const [removeOpen, setRemoveOpen] = useState(false);

  return (
    <>
      <Popover>
        <Popover.Trigger asChild>
          <Button
            isIconOnly
            variant="tertiary"
            className="size-9 rounded-full bg-transparent"
          >
            <StyledFeather
              name="more-vertical"
              size={18}
              className="text-muted"
            />
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Overlay />
          <Popover.Content
            presentation="popover"
            placement="left"
            width={230}
            className="gap-3 p-4"
          >
            <View className="gap-1">
              <Popover.Title>{user.name}</Popover.Title>
              <Popover.Description className="text-xs">
                Manage this member account.
              </Popover.Description>
            </View>
            <View className="gap-1">
              <UserAction icon="eye" label="View profile" />
              <UserAction icon="edit-2" label="Edit role" />
              <UserAction icon="mail" label="Send invite" />
              <Separator className="my-1" />
              <UserAction
                icon="user-x"
                label="Remove member"
                tone="danger"
                onPress={() => setRemoveOpen(true)}
              />
            </View>
          </Popover.Content>
        </Popover.Portal>
      </Popover>

      <Dialog isOpen={removeOpen} onOpenChange={setRemoveOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Close
              variant="ghost"
              className="absolute top-3 right-2.5 z-50"
            />
            <View className="size-10 rounded-full bg-danger/10 items-center justify-center mb-4">
              <StyledFeather name="user-x" size={18} className="text-danger" />
            </View>
            <View className="gap-2 mb-8">
              <Dialog.Title>Remove member?</Dialog.Title>
              <Dialog.Description>
                {user.name} will lose access to this workspace. This example
                only closes the dialog, but the pattern is ready for real
                removal logic.
              </Dialog.Description>
            </View>
            <View className="gap-3">
              <Button variant="danger" onPress={() => setRemoveOpen(false)}>
                <Button.Label>Remove member</Button.Label>
              </Button>
              <Button variant="tertiary" onPress={() => setRemoveOpen(false)}>
                <Button.Label>Cancel</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}

function UserRow({ user }: { user: DirectoryUser }) {
  return (
    <Card className="p-4 rounded-xl shadow-none border border-border bg-background">
      <View className="flex-row items-center gap-3">
        <Avatar size="md" variant="soft" color="accent">
          <Avatar.Image
            source={user.avatar ? { uri: user.avatar } : undefined}
          />
          <Avatar.Fallback>{user.initials}</Avatar.Fallback>
        </Avatar>

        <View className="flex-1 min-w-0 gap-1">
          <View className="flex-row items-center justify-between gap-2">
            <AppText
              className="text-base text-foreground font-semibold flex-1"
              numberOfLines={1}
            >
              {user.name}
            </AppText>
            <Chip size="sm" variant="secondary" color={roleColor(user.role)}>
              <Chip.Label>{user.role}</Chip.Label>
            </Chip>
          </View>
          <AppText className="text-xs text-muted" numberOfLines={1}>
            {user.email}
          </AppText>
        </View>

        <UserActionsPopover user={user} />
      </View>
    </Card>
  );
}

export default function UsersDirectoryExample() {
  const [search, setSearch] = useState('');

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term)
      );
    });
  }, [search]);

  return (
    <View className="flex-1 bg-background">
      <ScreenScrollView
        className="bg-background"
        contentContainerClassName="gap-6 px-5 pb-28"
      >
        <View className="gap-2">
          <AppText className="text-3xl text-foreground font-bold">
            Directory
          </AppText>
          <AppText className="text-base text-muted leading-6">
            Search members, review roles, and open user actions from a practical
            admin-style list.
          </AppText>
        </View>

        <InputGroup>
          <InputGroup.Prefix isDecorative>
            <MagnifierIcon size={16} colorClassName="accent-field-placeholder" />
          </InputGroup.Prefix>
          <InputGroup.Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search members..."
            autoCapitalize="none"
            autoCorrect={false}
          />
        </InputGroup>

        <View className="flex-row gap-4">
          <StatCard label="Total Users" value="1,284" meta="+12%" />
          <StatCard label="Active Now" value="42" isLive />
        </View>

        <View className="gap-3">
          {filteredUsers.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </View>

        {filteredUsers.length === 0 ? (
          <Surface className="items-center gap-3 p-6 rounded-2xl">
            <View className="size-12 rounded-full bg-accent/10 items-center justify-center">
              <MagnifierIcon size={20} colorClassName="accent-accent" />
            </View>
            <View className="items-center gap-1">
              <AppText className="text-base text-foreground font-semibold">
                No members found
              </AppText>
              <AppText className="text-sm text-muted text-center">
                Try searching by name, email, or role.
              </AppText>
            </View>
          </Surface>
        ) : null}
      </ScreenScrollView>

      <Button
        isIconOnly
        className="absolute right-6 bottom-8 size-14 rounded-full shadow-lg"
      >
        <StyledFeather
          name="user-plus"
          size={24}
          className="text-accent-foreground"
        />
      </Button>
    </View>
  );
}
