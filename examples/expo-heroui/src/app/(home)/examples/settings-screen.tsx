import { Feather } from '@expo/vector-icons';
import {
  Avatar,
  Button,
  Chip,
  ControlField,
  Description,
  Label,
  Separator,
  Surface,
  Switch,
} from 'heroui-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { withUniwind } from 'uniwind';
import { AppText } from '../../../components/app-text';
import { ScreenScrollView } from '../../../components/screen-scroll-view';

const StyledFeather = withUniwind(Feather);

type SettingsItem = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  tone: 'primary' | 'secondary' | 'tertiary';
  type?: 'link' | 'switch';
  description?: string;
};

const sections: { title: string; items: SettingsItem[] }[] = [
  {
    title: 'Account',
    items: [
      { icon: 'user', label: 'Profile Information', tone: 'primary' },
      { icon: 'shield', label: 'Privacy & Security', tone: 'primary' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      {
        icon: 'bell',
        label: 'Notifications',
        description: 'Push alerts and workspace updates',
        tone: 'secondary',
        type: 'switch',
      },
      { icon: 'sliders', label: 'Appearance', value: 'Light', tone: 'secondary' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle', label: 'Help Center', tone: 'tertiary' },
      { icon: 'info', label: 'About Luminous', tone: 'tertiary' },
    ],
  },
];

function toneClasses(tone: SettingsItem['tone']) {
  if (tone === 'primary') {
    return 'bg-accent/10 text-accent';
  }

  if (tone === 'tertiary') {
    return 'bg-sky-500/10 text-sky-700';
  }

  return 'bg-muted/10 text-muted';
}

function toneIconClass(tone: SettingsItem['tone']) {
  if (tone === 'primary') {
    return 'text-accent';
  }

  if (tone === 'tertiary') {
    return 'text-sky-700';
  }

  return 'text-muted';
}

function SettingsRow({ item, isLast }: { item: SettingsItem; isLast: boolean }) {
  const [enabled, setEnabled] = useState(true);
  const leadingIcon = (
    <View
      className={`size-10 rounded-xl items-center justify-center ${toneClasses(
        item.tone
      )}`}
    >
      <StyledFeather
        name={item.icon}
        size={19}
        className={toneIconClass(item.tone)}
      />
    </View>
  );

  if (item.type === 'switch') {
    return (
      <View>
        <ControlField
          isSelected={enabled}
          onSelectedChange={setEnabled}
          className="px-4 py-4"
        >
          {leadingIcon}
          <View className="flex-1">
            <Label>{item.label}</Label>
            <Description>{item.description}</Description>
          </View>
          <ControlField.Indicator>
            <Switch />
          </ControlField.Indicator>
        </ControlField>
        {!isLast ? <Separator className="ml-16 mr-4" /> : null}
      </View>
    );
  }

  return (
    <View>
      <Pressable className="flex-row items-center justify-between px-4 py-4">
        <View className="flex-row items-center gap-4 flex-1">
          {leadingIcon}
          <AppText className="text-foreground text-base flex-1">
            {item.label}
          </AppText>
        </View>

        <View className="flex-row items-center gap-2">
          {item.value ? (
            <AppText className="text-muted text-sm font-medium">
              {item.value}
            </AppText>
          ) : null}
          <StyledFeather
            name="chevron-right"
            size={19}
            className="text-muted"
          />
        </View>
      </Pressable>
      {!isLast ? <Separator className="ml-16 mr-4" /> : null}
    </View>
  );
}

function SettingsSection({
  title,
  items,
}: {
  title: string;
  items: SettingsItem[];
}) {
  return (
    <View className="gap-2">
      <AppText className="text-xs text-muted uppercase font-semibold tracking-widest px-2">
        {title}
      </AppText>
      <Surface className="p-0 rounded-3xl overflow-hidden border border-border bg-background">
        {items.map((item, index) => (
          <SettingsRow
            key={item.label}
            item={item}
            isLast={index === items.length - 1}
          />
        ))}
      </Surface>
    </View>
  );
}

export default function SettingsScreenExample() {
  return (
    <View className="flex-1 bg-background">
      <ScreenScrollView
        className="bg-background"
        contentContainerClassName="gap-6 px-5"
      >
        <Surface className="rounded-3xl border border-border bg-background p-5">
          <View className="flex-row items-center gap-4">
            <View className="relative">
              <Avatar size="lg" variant="soft" color="accent">
                <Avatar.Image source={undefined} />
                <Avatar.Fallback>AR</Avatar.Fallback>
              </Avatar>
              <Button
                isIconOnly
                size="sm"
                className="absolute bottom-0 right-0 size-7 rounded-full bg-accent border-2 border-background"
              >
                <StyledFeather
                  name="edit-2"
                  size={13}
                  className="text-accent-foreground"
                />
              </Button>
            </View>

            <View className="flex-1">
              <AppText className="text-xl text-foreground font-semibold">
                Alex Rivera
              </AppText>
              <AppText className="text-muted text-sm">
                alex.rivera@luminous.com
              </AppText>
              <Chip size="sm" variant="secondary" color="accent" className="self-start mt-2">
                <Chip.Label>Premium Member</Chip.Label>
              </Chip>
            </View>
          </View>
        </Surface>

        {sections.map((section) => (
          <SettingsSection
            key={section.title}
            title={section.title}
            items={section.items}
          />
        ))}

        <Button variant="danger-soft" className="rounded-3xl h-14">
          Log Out
        </Button>
      </ScreenScrollView>
    </View>
  );
}
