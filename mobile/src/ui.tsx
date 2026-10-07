import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, F } from "./theme";

export function Screen({ children, scroll = true, pad = true }: { children: React.ReactNode; scroll?: boolean; pad?: boolean }) {
  const body = scroll
    ? <ScrollView contentContainerStyle={[s.screen, pad && { paddingHorizontal: 16 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
    : <View style={[s.screen, pad && { paddingHorizontal: 16 }, { flex: 1 }]}>{children}</View>;
  return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top", "left", "right"]}>{body}</SafeAreaView>;
}

export const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => <View style={[s.card, style]}>{children}</View>;
export const Eyebrow = ({ children }: { children: React.ReactNode }) => <Text style={s.eyebrow}>{String(children).toUpperCase()}</Text>;
export const H1 = ({ children }: { children: React.ReactNode }) => <Text style={s.h1}>{children}</Text>;
export const H2 = ({ children }: { children: React.ReactNode }) => <Text style={s.h2}>{children}</Text>;
export const H3 = ({ children }: { children: React.ReactNode }) => <Text style={s.h3}>{children}</Text>;
export const P = ({ children, dim, style }: { children: React.ReactNode; dim?: boolean; style?: object }) => <Text style={[s.p, dim && { color: C.ink3 }, style]}>{children}</Text>;

export function Button({ label, onPress, kind = "gold", disabled, busy, icon }: { label: string; onPress: () => void; kind?: "gold" | "ghost"; disabled?: boolean; busy?: boolean; icon?: React.ReactNode }) {
  const gold = kind === "gold";
  return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled || busy} style={({ pressed }) => [s.btn, gold ? s.btnGold : s.btnGhost, (disabled || busy) && { opacity: 0.55 }, pressed && { transform: [{ scale: 0.98 }] }]}>
    {busy ? <ActivityIndicator color={gold ? C.bg : C.gold}/> : <>{icon}<Text style={[s.btnText, { color: gold ? C.bg : C.gold }]}>{gold ? label.toUpperCase() : label}</Text></>}
  </Pressable>;
}

export function Field({ label, ...input }: { label: string } & TextInputProps) {
  return <View style={{ gap: 6 }}>
    <Text style={s.label}>{label}</Text>
    <TextInput placeholderTextColor={C.ink3} {...input} style={[s.input, input.multiline && { minHeight: 96, textAlignVertical: "top" }]}/>
  </View>;
}

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={[s.chip, on && { backgroundColor: C.gold, borderColor: C.gold }]}><Text style={[s.chipText, on && { color: C.bg }]}>{label}</Text></Pressable>;
}

export function Bar({ value, max = 100 }: { value: number; max?: number }) {
  return <View style={s.barTrack}><View style={[s.barFill, { width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }]}/></View>;
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return <View pointerEvents="none" style={s.toast}><Text style={s.toastText}>{message}</Text></View>;
}

export const Gap = ({ n = 12 }: { n?: number }) => <View style={{ height: n }}/>;

export const s = StyleSheet.create({
  screen: { paddingTop: 12, paddingBottom: 110, gap: 14 },
  card: { backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.lineSoft, padding: 18, gap: 8 },
  eyebrow: { fontFamily: F.bold, fontSize: 11, letterSpacing: 1.6, color: C.gold },
  h1: { fontFamily: F.display, fontSize: 26, lineHeight: 32, color: C.goldSoft },
  h2: { fontFamily: F.display, fontSize: 21, lineHeight: 27, color: C.goldSoft },
  h3: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  p: { fontFamily: F.body, fontSize: 15, lineHeight: 23, color: C.ink2 },
  btn: { minHeight: 50, borderRadius: 16, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnGold: { backgroundColor: C.goldDeep },
  btnGhost: { borderWidth: 1, borderColor: C.line },
  btnText: { fontFamily: F.black, fontSize: 13, letterSpacing: 0.8 },
  label: { fontFamily: F.bold, fontSize: 13, color: C.ink2 },
  input: { fontFamily: F.body, fontSize: 16, color: C.ink, backgroundColor: C.card2, borderRadius: 14, borderWidth: 1, borderColor: C.lineSoft, paddingHorizontal: 14, paddingVertical: 12 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: C.line, paddingHorizontal: 14, paddingVertical: 9 },
  chipText: { fontFamily: F.bold, fontSize: 13, color: C.ink },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: C.card2, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4, backgroundColor: C.goldDeep },
  toast: { position: "absolute", left: 16, right: 16, top: 56, backgroundColor: C.card2, borderColor: C.line, borderWidth: 1, borderRadius: 16, padding: 14 },
  toastText: { fontFamily: F.bold, fontSize: 14, color: C.goldSoft, textAlign: "center" },
});

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (value: T) => void }) {
  return <View style={{ flexDirection: "row", backgroundColor: C.card, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: C.lineSoft }}>
    {options.map(([key, label]) => <Pressable key={key} onPress={() => onChange(key)} accessibilityRole="tab" accessibilityState={{ selected: value === key }} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center", backgroundColor: value === key ? C.card2 : "transparent" }}>
      <Text style={{ fontFamily: value === key ? F.black : F.bold, fontSize: 12, color: value === key ? C.gold : C.ink3 }}>{label}</Text>
    </Pressable>)}
  </View>;
}
