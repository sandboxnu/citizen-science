import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useEffectEvent, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { FontFamily, ReportColors, Spacing } from '@/constants/theme';

// The wave artwork is 393×824 on an 852pt-tall screen.
const WAVE_HEIGHT_RATIO = 824 / 852;
const AUTO_DISMISS_MS = 3000;

type ReportSuccessProps = { onDone: () => void };

// Shown after a report is submitted: the blue wave drops in from the top, then the message fades in.
export function ReportSuccess({ onDone }: ReportSuccessProps) {
  const { width, height } = useWindowDimensions();
  const waveHeight = height * WAVE_HEIGHT_RATIO;
  const [wave] = useState(() => new Animated.Value(0));
  const [content] = useState(() => new Animated.Value(0));

  const finish = useEffectEvent(onDone);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(wave, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(content, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => finish(), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [wave, content]);

  return (
    <Pressable style={styles.container} onPress={onDone} accessibilityLabel="Report submitted. Thank you! Tap to continue.">
      <StatusBar style="light" />
      <Animated.View
        style={[
          styles.wave,
          { transform: [{ translateY: wave.interpolate({ inputRange: [0, 1], outputRange: [-waveHeight, 0] }) }] },
        ]}>
        <Image
          source={require('@/assets/images/success-wave.svg')}
          style={{ width, height: waveHeight }}
          contentFit="fill"
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: content,
            transform: [{ translateY: content.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
          },
        ]}>
        <View style={styles.message}>
          <Image source={require('@/assets/images/reportIcons/circle-check.svg')} style={styles.check} />
          <View style={styles.text}>
            <Text style={styles.title} accessibilityRole="header">
              Report Submitted
            </Text>
            <Text style={styles.subtitle}>Thank you!</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ReportColors.background },
  wave: { position: 'absolute', top: 0, left: 0, right: 0 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  message: { alignItems: 'center', gap: Spacing.eleven, padding: Spacing.ten },
  check: { width: 58, height: 58 },
  text: { alignItems: 'center', gap: Spacing.seven },
  title: { fontFamily: FontFamily.semiBold, fontSize: 24, lineHeight: 28.8, color: ReportColors.surface },
  subtitle: { fontFamily: FontFamily.regular, fontSize: 16, lineHeight: 19.2, color: ReportColors.surface },
});
