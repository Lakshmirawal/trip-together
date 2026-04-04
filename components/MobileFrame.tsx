import { Platform, View, StyleSheet } from 'react-native';
import { ReactNode } from 'react';

export default function MobileFrame({ children }: { children: ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;

  return (
    <View style={styles.outer}>
      <View style={styles.phone}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A2E',
  },
  phone: {
    width: 390,
    maxWidth: '100%' as any,
    flex: 1,
    backgroundColor: '#fff',
    overflow: 'hidden' as any,
    // @ts-ignore - web only
    boxShadow: '0 8px 48px rgba(0,0,0,0.18)',
  },
});
