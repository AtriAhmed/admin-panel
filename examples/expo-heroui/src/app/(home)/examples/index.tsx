import { View } from 'react-native';
import {
  ExampleRouteCard,
  ExampleScreen,
  type ExampleRoute,
} from '../../../components/examples/example-layout';

const EXAMPLE_ROUTES: ExampleRoute[] = [
  {
    title: 'Auth Screen',
    description: 'A polished sign-in flow with inputs, trust signals, and actions.',
    href: '/examples/auth-screen',
    icon: 'lock',
    badge: 'Screen',
  },
  {
    title: 'Settings Screen',
    description: 'Account, preferences, billing, security, and sign-out states.',
    href: '/examples/settings-screen',
    icon: 'settings',
    badge: 'Screen',
  },
  {
    title: 'Paywall Screen',
    description: 'Plan selection, feature comparison, and checkout bottom sheet.',
    href: '/examples/paywall-screen',
    icon: 'credit-card',
    badge: 'Screen',
  },
  {
    title: 'Users Directory',
    description: 'A searchable member list with stats, roles, avatars, and actions.',
    href: '/examples/users-directory',
    icon: 'users',
    badge: 'List',
  },
  {
    title: 'Notifications',
    description: 'Unread/read activity cards, promo block, and mark-as-read actions.',
    href: '/examples/notifications-screen',
    icon: 'bell',
    badge: 'Feed',
  },
];

export default function ExamplesIndexScreen() {
  return (
    <ExampleScreen
      eyebrow="HeroUI Native Lab"
      title="Realistic Examples"
      description="Five practical screens built with HeroUI Native components. Use these as the main playground for client-facing patterns."
    >
      <View className="gap-4">
        {EXAMPLE_ROUTES.map((route, index) => (
          <ExampleRouteCard
            key={String(route.href)}
            route={route}
            index={index}
          />
        ))}
      </View>
    </ExampleScreen>
  );
}
