import { View, Text } from 'react-native';

type Props = {
  name: string;
  size?: number; // in Tailwind units (1 unit = 4px), default 10 = 40px
  pending?: boolean;
};

const COLORS = ['#0D9488', '#F97316', '#F59E0B', '#1A3C5E', '#A855F7', '#EC4899'];

function getColor(name: string): string {
  return COLORS[name.charCodeAt(0) % COLORS.length];
}

export default function MemberAvatar({ name, size = 10, pending = false }: Props) {
  const px = size * 4; // convert Tailwind units to pixels
  const fontSize = Math.round(px * 0.38);

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      style={{
        width: px,
        height: px,
        borderRadius: px / 2,
        backgroundColor: pending ? '#E5E7EB' : getColor(name),
        borderWidth: pending ? 2 : 0,
        borderStyle: pending ? 'dashed' : 'solid',
        borderColor: pending ? '#9CA3AF' : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize,
          fontWeight: 'bold',
          color: pending ? '#6B7280' : '#FFFFFF',
        }}
      >
        {pending ? '?' : initials}
      </Text>
    </View>
  );
}
