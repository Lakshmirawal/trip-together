import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setServerError('');
    setSuccessMsg('');

    if (!email.trim()) {
      setEmailError('Please enter your email address.');
      valid = false;
    } else if (!validateEmail(email.trim())) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    }
    if (!password) {
      setPasswordError('Please enter a password.');
      valid = false;
    } else if (mode === 'signup' && password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });
      setLoading(false);

      if (error) {
        setServerError(error.message);
        return;
      }
      // If session is null after sign up, email confirmation is still ON in Supabase
      if (!data.session) {
        setSuccessMsg('Account created! Please confirm your email then sign in.');
        setMode('signin');
        return;
      }
      // Session exists — _layout.tsx onAuthStateChange will navigate automatically

    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      setLoading(false);

      if (error) {
        if (error.message.toLowerCase().includes('invalid')) {
          setServerError('Incorrect email or password. Please try again.');
        } else {
          setServerError(error.message);
        }
        return;
      }
      // Session set — _layout.tsx onAuthStateChange will navigate automatically
    }
  };

  const handleForgotPassword = async () => {
    setEmailError('');
    setServerError('');
    setSuccessMsg('');
    if (!email.trim()) { setEmailError('Please enter your email address.'); return; }
    if (!validateEmail(email.trim())) { setEmailError('Please enter a valid email address.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${process.env.EXPO_PUBLIC_APP_URL}/reset-password`,
    });
    setLoading(false);
    if (error) { setServerError(error.message); return; }
    setSuccessMsg('Reset link sent! Check your email inbox.');
  };

  const switchMode = (m: 'signin' | 'signup' | 'forgot') => {
    setMode(m);
    setEmailError('');
    setPasswordError('');
    setServerError('');
    setSuccessMsg('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-8">
          {/* Logo */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 rounded-2xl bg-navy items-center justify-center mb-4">
              <Text className="text-white text-3xl">✦</Text>
            </View>
            <Text className="text-3xl font-bold text-navy">TripTogether</Text>
            <Text className="text-muted text-sm mt-1">Plan trips, together.</Text>
          </View>

          {/* Mode toggle — hidden in forgot mode */}
          {mode !== 'forgot' && (
            <View className="flex-row bg-gray-100 rounded-xl p-1 mb-6">
              <TouchableOpacity
                className={`flex-1 py-2.5 rounded-lg items-center ${mode === 'signin' ? 'bg-white' : ''}`}
                onPress={() => switchMode('signin')}
              >
                <Text className={`text-sm font-semibold ${mode === 'signin' ? 'text-navy' : 'text-muted'}`}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2.5 rounded-lg items-center ${mode === 'signup' ? 'bg-white' : ''}`}
                onPress={() => switchMode('signup')}
              >
                <Text className={`text-sm font-semibold ${mode === 'signup' ? 'text-navy' : 'text-muted'}`}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Forgot password header */}
          {mode === 'forgot' && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#0D2B1F', marginBottom: 4 }}>Reset password</Text>
              <Text style={{ fontSize: 13, color: '#64748B' }}>Enter your email and we'll send a reset link.</Text>
            </View>
          )}

          {/* Success message */}
          {successMsg ? (
            <View className="bg-success/10 border border-success/30 rounded-xl px-4 py-3 mb-4">
              <Text className="text-success text-sm font-medium text-center">{successMsg}</Text>
            </View>
          ) : null}

          {/* Server error */}
          {serverError ? (
            <View className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 mb-4">
              <Text className="text-danger text-sm text-center">{serverError}</Text>
            </View>
          ) : null}

          {/* Email */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Email address</Text>
            <TextInput
              className={`border rounded-xl px-4 py-3.5 text-base text-gray-900 ${emailError ? 'border-danger' : 'border-gray-300'}`}
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={(t) => { setEmail(t); setEmailError(''); setServerError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {emailError ? <Text className="text-danger text-xs mt-1">{emailError}</Text> : null}
          </View>

          {/* Password — hidden in forgot mode */}
          {mode !== 'forgot' && (
            <View className="mb-2">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Password</Text>
              <TextInput
                className={`border rounded-xl px-4 py-3.5 text-base text-gray-900 ${passwordError ? 'border-danger' : 'border-gray-300'}`}
                placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Your password'}
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={(t) => { setPassword(t); setPasswordError(''); setServerError(''); }}
                secureTextEntry
                autoCapitalize="none"
              />
              {passwordError ? <Text className="text-danger text-xs mt-1">{passwordError}</Text> : null}
            </View>
          )}

          {/* Forgot password link — only in signin mode */}
          {mode === 'signin' && (
            <TouchableOpacity onPress={() => switchMode('forgot')} style={{ alignSelf: 'flex-end', marginBottom: 20, marginTop: 6 }}>
              <Text style={{ fontSize: 12, color: '#0D2B1F', fontWeight: '600' }}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          {mode !== 'signin' && mode !== 'signup' ? null : <View style={{ marginBottom: mode === 'signup' ? 24 : 0 }} />}

          {/* Submit */}
          <TouchableOpacity
            style={{ borderRadius: 12, paddingVertical: 16, alignItems: 'center', backgroundColor: loading ? '#9CA3AF' : '#0D2B1F', marginBottom: 16 }}
            onPress={mode === 'forgot' ? handleForgotPassword : handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                {mode === 'signin' ? 'Sign In →' : mode === 'signup' ? 'Create Account →' : 'Send Reset Link →'}
              </Text>
            )}
          </TouchableOpacity>

          {mode === 'forgot' ? (
            <TouchableOpacity onPress={() => switchMode('signin')} style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: '#64748B' }}>← Back to Sign In</Text>
            </TouchableOpacity>
          ) : (
            <Text className="text-center text-muted text-xs mt-0">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <Text
                className="text-navy font-semibold"
                onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              >
                {mode === 'signin' ? 'Sign up free' : 'Sign in'}
              </Text>
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
