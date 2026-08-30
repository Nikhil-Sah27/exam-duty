import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLogin } from "@/shared/hooks/useAuth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutation, blockedMessage } = useLogin();

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleSubmit = () => {
    if (!canSubmit || mutation.isPending) return;
    mutation.mutate({ email: email.trim(), password });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>Exam Duty</Text>
          <Text style={styles.subheading}>
            Sign in to manage your invigilation duties
          </Text>

          {mutation.isError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{mutation.error.message}</Text>
            </View>
          )}

          {blockedMessage && (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>{blockedMessage}</Text>
            </View>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
          />

          <Pressable
            style={[
              styles.button,
              (!canSubmit || mutation.isPending) && styles.buttonDisabled,
            ]}
            disabled={!canSubmit || mutation.isPending}
            onPress={handleSubmit}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  heading: { fontSize: 28, fontWeight: "700", color: "#1e293b" },
  subheading: { marginTop: 4, marginBottom: 28, fontSize: 14, color: "#64748b" },
  label: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  input: {
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0f172a",
  },
  button: {
    marginTop: 6,
    borderRadius: 8,
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  errorBox: {
    marginBottom: 18,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
    padding: 12,
  },
  errorText: { color: "#b91c1c", fontSize: 13 },
  noticeBox: {
    marginBottom: 18,
    borderRadius: 8,
    backgroundColor: "#e0e7ff",
    padding: 12,
  },
  noticeText: { color: "#3730a3", fontSize: 13, lineHeight: 19 },
});
