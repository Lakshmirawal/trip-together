import { TouchableOpacity, Text, View } from 'react-native';
import { openWhatsApp } from '../lib/whatsapp';

type Props = {
  url: string;
  label?: string;
  variant?: 'primary' | 'outline';
};

export default function WhatsAppButton({ url, label = 'Share on WhatsApp →', variant = 'primary' }: Props) {
  return (
    <TouchableOpacity
      onPress={() => openWhatsApp(url)}
      className={`flex-row items-center justify-center rounded-xl py-3.5 px-5 ${
        variant === 'primary' ? 'bg-[#25D366]' : 'border-2 border-[#25D366]'
      }`}
    >
      <Text className={`font-semibold text-sm ${variant === 'primary' ? 'text-white' : 'text-[#25D366]'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
