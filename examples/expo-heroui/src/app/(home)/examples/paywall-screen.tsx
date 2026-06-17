import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  Accordion,
  BottomSheet,
  Button,
  Card,
  Chip,
  Separator,
  Surface,
  Switch,
} from 'heroui-native';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { withUniwind } from 'uniwind';
import PaywallPreview from '../../../../assets/images/paywall-showcase-bg.jpeg';
import { AppText } from '../../../components/app-text';
import { ScreenScrollView } from '../../../components/screen-scroll-view';

const StyledFeather = withUniwind(Feather);

type Plan = {
  id: 'free' | 'pro' | 'business';
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  periodLabel: string;
  cta: string;
  featured?: boolean;
  features: string[];
};

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    periodLabel: 'mo',
    cta: 'Get Started',
    features: ['Up to 3 projects', 'Basic analytics', 'Community support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 19,
    annualPrice: 152,
    periodLabel: 'mo',
    cta: 'Try 7 Days Free',
    featured: true,
    features: [
      'Unlimited projects',
      'Advanced insights',
      'Priority email support',
      'Custom integrations',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    monthlyPrice: 49,
    annualPrice: 392,
    periodLabel: 'mo',
    cta: 'Contact Sales',
    features: ['Everything in Pro', 'Dedicated manager', 'SSO & SAML Auth'],
  },
];

const faqs = [
  {
    id: 'cancel',
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes. You can cancel from account settings, and your premium access remains active until the end of the current billing period.',
  },
  {
    id: 'payment',
    question: 'What payment methods do you accept?',
    answer:
      'The checkout can support major cards, Apple Pay, Google Pay, and invoice-based billing when connected to a payment provider.',
  },
  {
    id: 'non-profits',
    question: 'Do you offer discounts for non-profits?',
    answer:
      'Yes. Teams can request a discounted workspace plan after verifying their organization details.',
  },
];

function formatPrice(plan: Plan, isAnnual: boolean) {
  if (plan.monthlyPrice === 0) {
    return '$0';
  }

  return `$${isAnnual ? plan.annualPrice : plan.monthlyPrice}`;
}

function PlanCard({
  plan,
  isAnnual,
  onChoose,
}: {
  plan: Plan;
  isAnnual: boolean;
  onChoose: (plan: Plan) => void;
}) {
  const period = plan.monthlyPrice === 0 ? 'mo' : isAnnual ? 'yr' : 'mo';

  return (
    <Card
      className={`w-72 min-h-[360px] p-5 mr-4 shadow-none rounded-3xl ${
        plan.featured
          ? 'border-2 border-accent bg-background'
          : 'border border-border bg-background'
      }`}
    >
      <View className="flex-1 justify-between">
        <View className="gap-5">
          <View className="flex-row items-start justify-between gap-3">
            <View className="gap-1">
              <AppText
                className={`text-xs uppercase tracking-widest font-extrabold ${
                  plan.featured ? 'text-accent' : 'text-muted'
                }`}
              >
                {plan.name}
              </AppText>
              <View className="flex-row items-end gap-1">
                <AppText className="text-4xl text-foreground font-bold">
                  {formatPrice(plan, isAnnual)}
                </AppText>
                <AppText className="text-sm text-muted mb-1">/{period}</AppText>
              </View>
            </View>

            {plan.featured ? (
              <Chip size="sm" color="accent">
                <Chip.Label>Best Value</Chip.Label>
              </Chip>
            ) : null}
          </View>

          <View className="gap-4">
            {plan.features.map((feature) => (
              <View key={feature} className="flex-row items-center gap-3">
                <StyledFeather
                  name="check-circle"
                  size={20}
                  className="text-accent"
                />
                <AppText
                  className={`flex-1 text-sm ${
                    plan.featured
                      ? 'text-foreground font-semibold'
                      : 'text-foreground'
                  }`}
                >
                  {feature}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        <Button
          variant={plan.featured ? 'primary' : 'secondary'}
          className={`mt-8 h-12 rounded-xl ${
            plan.featured ? '' : 'border border-border'
          }`}
          onPress={() => onChoose(plan)}
        >
          <Button.Label>{plan.cta}</Button.Label>
        </Button>
      </View>
    </Card>
  );
}

export default function PaywallScreenExample() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const selectedPeriod = useMemo(
    () => (isAnnual ? 'Annual billing' : 'Monthly billing'),
    [isAnnual]
  );

  const selectedPrice = selectedPlan
    ? formatPrice(selectedPlan, isAnnual)
    : null;

  return (
    <ScreenScrollView
      className="bg-background"
      contentContainerClassName="gap-8 px-5 pb-10"
    >
      <View className="items-center gap-3">
        <AppText className="text-4xl text-foreground font-bold text-center">
          Choose Your Plan
        </AppText>
        <AppText className="text-base text-muted leading-6 text-center max-w-xs">
          Unlock premium features and take your experience to the next level.
        </AppText>
      </View>

      <View className="items-center gap-3">
        <View className="flex-row items-center justify-center gap-3">
          <AppText
            className={`text-xs font-semibold ${
              isAnnual ? 'text-muted' : 'text-foreground'
            }`}
          >
            Monthly
          </AppText>
          <Switch isSelected={isAnnual} onSelectedChange={setIsAnnual}>
            <Switch.Thumb />
          </Switch>
          <View className="flex-row items-center gap-2">
            <AppText
              className={`text-xs font-semibold ${
                isAnnual ? 'text-foreground' : 'text-muted'
              }`}
            >
              Annual
            </AppText>
            <Chip size="sm" color="accent">
              <Chip.Label>Save 20%</Chip.Label>
            </Chip>
          </View>
        </View>
        <AppText className="text-xs text-muted">{selectedPeriod}</AppText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={304}
        decelerationRate="fast"
        contentContainerClassName="pl-0 pr-1"
        className="-mx-1"
      >
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isAnnual={isAnnual}
            onChoose={setSelectedPlan}
          />
        ))}
      </ScrollView>

      <Button variant="tertiary" className="self-center bg-transparent">
        <Button.Label className="text-accent">
          Compare full features
        </Button.Label>
        <StyledFeather name="arrow-right" size={18} className="text-accent" />
      </Button>

      <View className="gap-4">
        <Separator />
        <AppText className="text-xl text-foreground font-semibold">
          Frequently Asked Questions
        </AppText>
        <Accordion variant="surface" className="w-full">
          {faqs.map((faq) => (
            <Accordion.Item key={faq.id} value={faq.id}>
              <Accordion.Trigger>
                <View className="flex-1">
                  <AppText className="text-sm text-foreground font-medium">
                    {faq.question}
                  </AppText>
                </View>
                <Accordion.Indicator />
              </Accordion.Trigger>
              <Accordion.Content>
                <AppText className="text-sm text-muted leading-5 px-4 pb-4">
                  {faq.answer}
                </AppText>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion>
      </View>

      <Surface className="rounded-3xl overflow-hidden p-0 border border-border">
        <Image
          source={PaywallPreview}
          className="w-full h-48"
          contentFit="cover"
        />
        <View className="p-4 gap-1">
          <AppText className="text-base text-foreground font-semibold">
            Premium workspace preview
          </AppText>
          <AppText className="text-sm text-muted leading-5">
            A visual proof block gives the pricing screen a real product
            context.
          </AppText>
        </View>
      </Surface>

      <BottomSheet
        isOpen={selectedPlan !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedPlan(null);
        }}
      >
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content>
            <View className="gap-5">
              <View className="gap-2">
                <BottomSheet.Title>
                  {selectedPlan?.name ?? 'Selected'} plan
                </BottomSheet.Title>
                <BottomSheet.Description>
                  Review the selected subscription before connecting real
                  checkout logic.
                </BottomSheet.Description>
              </View>

              <Surface className="p-4 gap-3">
                <View className="flex-row justify-between">
                  <AppText className="text-muted">Billing</AppText>
                  <AppText className="text-foreground font-semibold">
                    {selectedPeriod}
                  </AppText>
                </View>
                <Separator />
                <View className="flex-row justify-between">
                  <AppText className="text-muted">Due today</AppText>
                  <AppText className="text-foreground font-bold">
                    {selectedPrice}
                  </AppText>
                </View>
              </Surface>

              <View className="gap-3">
                <Button onPress={() => setSelectedPlan(null)}>
                  <Button.Label>Continue to checkout</Button.Label>
                </Button>
                <Button
                  variant="tertiary"
                  onPress={() => setSelectedPlan(null)}
                >
                  <Button.Label>Cancel</Button.Label>
                </Button>
              </View>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </ScreenScrollView>
  );
}
