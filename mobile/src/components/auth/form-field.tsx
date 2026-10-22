import { StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';

import { AuthColors, FontFamily, Spacing } from '@/constants/theme';

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
        placeholderTextColor={AuthColors.placeholder}
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
  label: { color: AuthColors.fieldLabel, fontFamily: FontFamily.regular, fontSize: 14, marginBottom: Spacing.two },
  required: { color: AuthColors.required },
  input: {
    borderWidth: 1,
    borderColor: AuthColors.inputBorder,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.ten,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: AuthColors.inputText,
  },
  inputError: { borderColor: AuthColors.required },
  error: { color: AuthColors.required, fontFamily: FontFamily.regular, fontSize: 12, marginTop: Spacing.one },
});
