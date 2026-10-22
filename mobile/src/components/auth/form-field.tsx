import { StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';

const PRIMARY = '#1F4A8C';
const REQUIRED = '#E75A0E';
const BORDER = '#BDBDBD';
const PLACEHOLDER = '#B3B3B3';

export type FormFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  required?: boolean;
  error?: string;
  style?: ViewStyle;
};

export function FormField({ label, required, error, style, ...inputProps }: FormFieldProps) {
  return (
    <View style={style}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={PLACEHOLDER}
        {...inputProps}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

type PresetFieldProps = Omit<FormFieldProps, 'label'> & { label?: string };

export function UsernameField({ label = 'Username', ...props }: PresetFieldProps) {
  return (
    <FormField
      label={label}
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="username"
      textContentType="username"
      {...props}
    />
  );
}

export function PasswordField({ label = 'Password', ...props }: PresetFieldProps) {
  return (
    <FormField
      label={label}
      secureTextEntry
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="password"
      textContentType="password"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  label: { color: PRIMARY, fontSize: 14, marginBottom: Spacing.two },
  required: { color: REQUIRED },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.ten,
    fontSize: 14,
    color: '#111111',
  },
  inputError: { borderColor: REQUIRED },
  error: { color: REQUIRED, fontSize: 12, marginTop: Spacing.one },
});
