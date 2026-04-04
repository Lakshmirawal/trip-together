import { Linking } from 'react-native';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://trip-together.vercel.app';

export function generateInviteLink(inviteToken: string): string {
  return `${APP_URL}/join/${inviteToken}`;
}

export function generateWhatsAppDeeplink(tripName: string, inviteToken: string): string {
  const link = generateInviteLink(inviteToken);
  const message = encodeURIComponent(
    `Hey! I'm planning *${tripName}* 🏖️\n\nJoin and tell me your travel preferences in 30 seconds:\n${link}\n\nNo account needed!`
  );
  return `https://wa.me/?text=${message}`;
}

export function generateTaskNudgeLink(tripName: string, taskTitle: string, tripId: string): string {
  const link = `${APP_URL}/trips/${tripId}`;
  const message = encodeURIComponent(
    `You've been assigned a task for *${tripName}*: ${taskTitle}\n\nCheck it here: ${link}`
  );
  return `https://wa.me/?text=${message}`;
}

export async function openWhatsApp(url: string): Promise<void> {
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    await Linking.openURL(url);
  }
}
