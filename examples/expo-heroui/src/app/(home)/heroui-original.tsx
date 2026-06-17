import { View } from 'react-native';
import { ExampleScreen } from '../../components/examples/example-layout';
import { HomeCard, originalCards } from './index';

export default function HeroUIOriginalScreen() {
  return (
    <ExampleScreen
      eyebrow="Reference"
      title="Original HeroUI Examples"
      description="These are the screens that came with the HeroUI Native example app. Keep them as a reference while building your own examples."
    >
      <View className="gap-6">
        {originalCards.map((card, index) => (
          <HomeCard
            key={card.title}
            title={card.title}
            imageLight={card.imageLight}
            imageDark={card.imageDark}
            count={card.count}
            footer={card.footer}
            path={card.path}
            index={index}
          />
        ))}
      </View>
    </ExampleScreen>
  );
}
