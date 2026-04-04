import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

const P = '#0D2B1F';
const GOLD = '#E8A020';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    setPasswordError(''); setConfirmError(''); setServerError('');
    let valid = true;
    if (!password) { setPasswordError('Please enter a new password.'); valid = false; }
    else if (password.length < 6) { setPasswordError('Password must be at least 6 characters.'); valid = false; }
    if (!confirm) { setConfirmError('Please confirm your password.'); valid = false; }
    else if (password && confirm !== password) { setConfirmError('Passwords do not match.'); valid = false; }
    if (!valid) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) { setServerError(error.message); return; }
    setDone(true);
  };

  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F4F3EF', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 36 }}>✅</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: P, marginBottom: 10, textAlign: 'center' }}>Password updated!</Text>
        <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 32 }}>
          Your password has been reset successfully. Sign in with your new password.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: P, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 40 }}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Go to Sign In →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>

          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: P, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Text style={{ color: GOLD, fontSize: 28 }}>✦</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: P, marginBottom: 4 }}>Set new password</Text>
            <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center' }}>Choose a strong password for your account.</Text>
          </View>

          {/* Server error */}
          {serverError ? (
            <View style={{ backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <Text style={{ color: '#DC2626', fontSize: 13, textAlign: 'center' }}>{serverError}</Text>
            </View>
          ) : null}

          {/* New password */}
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>
            New password <Text style={{ color: '#DC2626' }}>*</Text>
          </Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: passwordError ? '#DC2626' : '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#1F2937', marginBottom: 4 }}
            placeholder="Min. 6 characters"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
            secureTextEntry
            autoCapitalize="none"
          />
          {passwordError ? <Text style={{ color: '#DC2626', fontSize: 11, marginBottom: 12 }}>{passwordError}</Text> : <View style={{ marginBottom: 16 }} />}

          {/* Confirm password */}
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>
            Confirm password <Text style={{ color: '#DC2626' }}>*</Text>
          </Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: confirmError ? '#DC2626' : '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#1F2937', marginBottom: 4 }}
            placeholder="Re-enter your password"
            placeholderTextColor="#9CA3AF"
            value={confirm}
            onChangeText={(t) => { setConfirm(t); setConfirmError(''); }}
            secureTextEntry
            autoCapitalize="none"
          />
          {confirmError ? <Text style={{ color: '#DC2626', fontSize: 11, marginBottom: 12 }}>{confirmError}</Text> : <View style={{ marginBottom: 24 }} />}

          {/* Submit */}
          <TouchableOpacity
            style={{ backgroundColor: loading ? '#9CA3AF' : GOLD, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 }}
            onPress={handleReset}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={P} /> : <Text style={{ color: P, fontWeight: '800', fontSize: 15 }}>Update Password →</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={{ fontSize: 13, color: '#64748B' }}>← Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
