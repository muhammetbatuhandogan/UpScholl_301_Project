import { ReactNode, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { palette, radius, shadow, space } from './theme';

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.screenHeader}>
      <Text style={styles.screenTitle}>{title}</Text>
      {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Field(props: TextInputProps) {
  return <TextInput placeholderTextColor={palette.muted} style={styles.input} {...props} />;
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'ghost' | 'success';
  loading?: boolean;
  disabled?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: ButtonProps) {
  const bg =
    variant === 'danger'
      ? palette.danger
      : variant === 'success'
        ? palette.success
        : variant === 'ghost'
          ? 'transparent'
          : palette.primary;
  const textColor = variant === 'ghost' ? palette.primary : palette.primaryText;
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: isDisabled ? 0.6 : 1 },
        pressed && !isDisabled && styles.buttonPressed,
        variant === 'ghost' && styles.buttonGhost,
        variant === 'primary' && styles.buttonPrimaryShadow,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

export function Badge({
  label,
  color = palette.primary,
  soft = palette.primarySoft,
}: {
  label: string;
  color?: string;
  soft?: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: soft }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({
  value,
  height = 10,
  fill = palette.primary,
  track = '#e2e8f0',
}: {
  value: number;
  height?: number;
  fill?: string;
  track?: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.max(0, Math.min(100, value)),
      duration: 650,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={[styles.track, { height, backgroundColor: track, borderRadius: height / 2 }]}>
      <Animated.View
        style={[styles.fill, { width, backgroundColor: fill, borderRadius: height / 2 }]}
      />
    </View>
  );
}

export function Avatar({ name, color = palette.primary }: { name: string; color?: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View style={[styles.avatar, { backgroundColor: color }]}>
      <Text style={styles.avatarText}>{initials || '?'}</Text>
    </View>
  );
}

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: palette.border,
    gap: space.md,
    ...shadow.card,
  },
  screenHeader: {
    gap: 2,
    marginBottom: space.xs,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.text,
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13.5,
    color: palette.muted,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  sectionAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: palette.primary,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: palette.text,
  },
  muted: {
    color: palette.muted,
    fontSize: 13.5,
    lineHeight: 19,
  },
  label: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.inputBg,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 16,
    color: palette.text,
  },
  button: {
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonPrimaryShadow: {
    shadowColor: palette.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonGhost: {
    borderWidth: 1,
    borderColor: palette.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  chip: {
    backgroundColor: palette.chipBg,
    borderRadius: radius.full,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    alignSelf: 'flex-start',
  },
  chipText: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  track: {
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  segmented: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  segment: {
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  segmentActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  segmentText: {
    color: palette.text,
    fontWeight: '600',
    fontSize: 13.5,
  },
  segmentTextActive: {
    color: palette.primaryText,
  },
});
