import type { ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * The form shell every request kind shares: full-screen sheet, scrollable body,
 * reason field, and the submit button as the last row of the scroll content.
 *
 * The button lives inside the scroller rather than in a pinned footer on
 * purpose — a pinned footer relies on the platform resizing the window when the
 * keyboard opens, and on a short phone that leaves the action off-screen with
 * no way to reach it. Scrolled content can always be brought into view.
 */
export default function RequestSheet({
  visible,
  title,
  subtitle,
  reason,
  onReasonChange,
  reasonRequired,
  reasonPlaceholder,
  submitLabel,
  canSubmit,
  submitting,
  error,
  onClose,
  onSubmit,
  children,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  reason: string;
  onReasonChange: (value: string) => void;
  reasonRequired: boolean;
  reasonPlaceholder: string;
  submitLabel: string;
  canSubmit: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <Pressable
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {children}

            <Text style={styles.sectionLabel}>
              Reason{reasonRequired ? "" : " (optional)"}
            </Text>
            <TextInput
              style={styles.input}
              value={reason}
              onChangeText={onReasonChange}
              placeholder={reasonPlaceholder}
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              style={[
                styles.submit,
                (!canSubmit || submitting) && styles.submitDisabled,
              ]}
              disabled={!canSubmit || submitting}
              onPress={onSubmit}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitText}>{submitLabel}</Text>
              )}
            </Pressable>

            <Pressable style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  subtitle: { marginTop: 2, fontSize: 12, color: "#64748b" },
  closeButton: { padding: 6 },
  closeText: { fontSize: 18, color: "#94a3b8" },
  content: { padding: 16, paddingBottom: 40 },
  sectionLabel: {
    marginTop: 18,
    marginBottom: 6,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#94a3b8",
  },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a",
  },
  errorBox: {
    marginTop: 14,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
    padding: 12,
  },
  errorText: { color: "#b91c1c", fontSize: 13 },
  submit: {
    marginTop: 18,
    borderRadius: 8,
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: "#ffffff", fontSize: 15, fontWeight: "600" },
  cancel: { marginTop: 10, paddingVertical: 12, alignItems: "center" },
  cancelText: { color: "#64748b", fontSize: 14, fontWeight: "500" },
});
