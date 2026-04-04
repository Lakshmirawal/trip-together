import { View, Text } from 'react-native';

type Props = {
  content: string;
  isUser?: boolean;
  isLoading?: boolean;
};

export default function AIBubble({ content, isUser = false, isLoading = false }: Props) {
  if (isUser) {
    return (
      <View className="items-end mb-3">
        <View className="bg-gray-100 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
          <Text className="text-gray-900 text-sm">{content}</Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="items-start mb-3">
        <View className="bg-navy rounded-2xl rounded-tl-sm px-4 py-3">
          <Text className="text-white text-sm opacity-80">✦ Thinking...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="items-start mb-3">
      <View className="bg-navy rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
        <Text className="text-blue-200 text-xs mb-1 font-semibold">✦ TripMate</Text>
        <Text className="text-white text-sm leading-5">{content}</Text>
      </View>
    </View>
  );
}
