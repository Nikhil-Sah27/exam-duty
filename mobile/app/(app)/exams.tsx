import { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ExamDetail from "@/features/exams/components/ExamDetail";
import ExamList from "@/features/exams/components/ExamList";

/**
 * Read-only exam browser. List and detail live in one route rather than in a
 * nested `exams/[id]` stack: a nested route inside a tab would put a second
 * navigator under the tab bar, and the list ↔ detail hop is the only
 * navigation this screen has.
 */
export default function ExamsScreen() {
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {openGroupId ? (
        <ExamDetail
          groupId={openGroupId}
          onBack={() => setOpenGroupId(null)}
        />
      ) : (
        <ExamList onOpen={(group) => setOpenGroupId(group._id)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
});
