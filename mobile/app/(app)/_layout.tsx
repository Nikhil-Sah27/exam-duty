import { Text, type ColorValue } from "react-native";
import { Tabs } from "expo-router/js-tabs";

/**
 * The five tabs mirror the web sidebar that Invigilator, RS and DCS all share
 * (frontend/src/modules/shared/role-config/roleConfig.ts → navItems); the
 * sixth, Alerts, is the mobile notification inbox. All three roles get the
 * same tabs — only the content differs, and RS/DCS content is always
 * group-shaped.
 *
 * Icons are text glyphs on purpose: no icon package is installed yet, and a
 * placeholder foundation should not force one on the screen agents.
 */

const tabIcon =
  (glyph: string) =>
  ({ color }: { color: ColorValue }) => (
    <Text style={{ fontSize: 20, color }}>{glyph}</Text>
  );

export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4f46e5",
        tabBarInactiveTintColor: "#94a3b8",
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: "Dashboard", tabBarIcon: tabIcon("◧") }}
      />
      <Tabs.Screen
        name="exams"
        options={{ title: "Exams", tabBarIcon: tabIcon("▤") }}
      />
      <Tabs.Screen
        name="select-duty"
        options={{ title: "Select Duty", tabBarIcon: tabIcon("✓") }}
      />
      <Tabs.Screen
        name="upcoming-duties"
        options={{ title: "Upcoming", tabBarIcon: tabIcon("◷") }}
      />
      <Tabs.Screen
        name="change-requests"
        options={{ title: "Requests", tabBarIcon: tabIcon("⇄") }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ title: "Alerts", tabBarIcon: tabIcon("◔") }}
      />
    </Tabs>
  );
}
