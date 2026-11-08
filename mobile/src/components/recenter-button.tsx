import { useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { RecenterButtonColors, Spacing } from '@/constants/theme';

export const ACTIVE_DURATION_MS = 1000;

type RecenterButtonProps = {
  onRecenter: () => void;
};

export function RecenterButton({ onRecenter }: RecenterButtonProps) {
    const [active, setActive] = useState(false);
    const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (timeout.current) clearTimeout(timeout.current);
    }, []);

    const handlePress = () => {
        onRecenter();
        setActive(true);
        if (timeout.current) clearTimeout(timeout.current);
        timeout.current = setTimeout(() => setActive(false), ACTIVE_DURATION_MS);
    };

    return (
        <View style={styles.container} pointerEvents="box-none">
            <Pressable
                style={[styles.button, active && styles.buttonActive]}
                accessibilityRole="button"
                accessibilityLabel="Center map on my location"
                onPress={handlePress}
            >
                <Image
                    source={
                        active
                            ? require('@/assets/images/mapIcons/locate-light.svg')
                            : require('@/assets/images/mapIcons/locate-dark.svg')
                    }
                    style={styles.icon}
                />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: Spacing.five,
    bottom: Spacing.five,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8.312,
    borderRadius: 7.245,
    backgroundColor: RecenterButtonColors.background,
    boxShadow: `0px 0px 2px ${RecenterButtonColors.shadow}`,
  },
  buttonActive: {
    backgroundColor: RecenterButtonColors.activeBackground,
  },
  icon: { width: 19.376, height: 19.376 },
});
