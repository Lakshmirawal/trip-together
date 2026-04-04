import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { generateInviteLink, generateWhatsAppDeeplink, openWhatsApp } from '../../../lib/whatsapp';
import WhatsAppButton from '../../../components/WhatsAppButton';
import { useState } from 'react';

export default function InviteScreen() {
  const { tripId, tripName, inviteToken } = useLocalSearchParams<{
    tripId: string;
    tripName: string;
    inviteToken: string;
  }>();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const inviteLink = generateInviteLink(inviteToken);
  const whatsappUrl = generateWhatsAppDeeplink(tripName, inviteToken);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSMS = async () => {
    const message = `Hey! I'm planning ${tripName} 🏖️ Join and tell me your preferences: ${inviteLink}`;
    await Share.share({ message });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-row items-center px-5 pt-4 pb-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-navy">Invite your group</Text>
        </View>

        <View className="px-5 pt-4">
          {/* Success header */}
          <View className="items-center py-6">
            <Text className="text-5xl mb-3">🎉</Text>
            <Text className="text-xl font-bold text-navy text-center">
              Your invite link is ready!
            </Text>
            <Text className="text-muted text-sm mt-2 text-center">
              Share it and group members can submit their preferences without signing up
            </Text>
          </View>

          {/* Link */}
          <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
            <Text className="text-xs text-muted mb-1">Invite link</Text>
            <Text className="text-sm text-navy font-mono" numberOfLines={1}>
              {inviteLink}
            </Text>
          </View>

          {/* WhatsApp preview card */}
          <View className="bg-[#E2FFC7] rounded-2xl p-5 mb-5">
            <Text className="text-sm font-semibold text-gray-800 mb-2">Message preview</Text>
            <View className="bg-white rounded-xl p-3">
              <Text className="text-sm text-gray-700 leading-5">
                {`Hey! I'm planning `}<Text className="font-bold">{tripName}</Text>{` 🏖️\n\nJoin and tell me your travel preferences in 30 seconds:\n`}
                <Text className="text-blue-600">{inviteLink}</Text>
                {`\n\nNo account needed!`}
              </Text>
            </View>
          </View>

          {/* Share buttons */}
          <View className="gap-3 mb-6">
            <WhatsAppButton url={whatsappUrl} label="Share on WhatsApp →" />

            <TouchableOpacity
              className="border border-gray-300 rounded-xl py-3.5 items-center"
              onPress={handleSMS}
            >
              <Text className="text-gray-700 font-semibold text-sm">Share via SMS / Other</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`rounded-xl py-3.5 items-center ${copied ? 'bg-success/10' : 'bg-gray-50 border border-gray-200'}`}
              onPress={handleCopy}
            >
              <Text className={`font-semibold text-sm ${copied ? 'text-success' : 'text-gray-700'}`}>
                {copied ? '✓ Link copied!' : 'Copy link'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="bg-navy rounded-xl py-4 items-center mb-4"
            onPress={() => router.push(`/(app)/trips/${tripId}/group` as any)}
          >
            <Text className="text-white font-semibold text-base">Open group chat →</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="border border-gray-300 rounded-xl py-3.5 items-center mb-8"
            onPress={() => router.push(`/(app)/trips/${tripId}/index` as any)}
          >
            <Text className="text-gray-600 font-semibold text-sm">Go to trip dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
