import React, { useEffect, useState } from "react";
import { ActivityIndicator, BackHandler, Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFonts, Cinzel_600SemiBold } from "@expo-google-fonts/cinzel";
import { Manrope_500Medium, Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";
import { Home, Leaf, MessagesSquare, Orbit, Route, Sparkles, Telescope, UserRound, Lock } from "lucide-react-native";
import { AppProvider, useApp } from "./src/store";
import { C, F } from "./src/theme";
import { FREE_VIEWS, TABS, type View as TabView } from "./src/nav";
import { Toast } from "./src/ui";
import { watchForUpdates } from "./src/updates";
import { AuthFlow } from "./src/screens/Auth";
import { Onboarding } from "./src/screens/Onboarding";
import { HomeScreen, RitualModal } from "./src/screens/Home";
import { SignsScreen } from "./src/screens/Signs";
import { TreeScreen } from "./src/screens/Tree";
import { JourneyScreen } from "./src/screens/Journey";
import { JournalScreen } from "./src/screens/Journal";
import { DiagnosticScreen } from "./src/screens/Diagnostic";
import { ChatScreen } from "./src/screens/Chat";
import { RadarScreen } from "./src/screens/Radar";
import { CommunityScreen } from "./src/screens/Community";
import { SignalsScreen } from "./src/screens/Signals";
import { ProfileScreen } from "./src/screens/Profile";
import { Locked, PaywallModal, PremiumScreen } from "./src/screens/Premium";

const ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = { home: Home, diagnostic: Telescope, signs: Sparkles, signals: Orbit, tree: Leaf, missions: Route, community: MessagesSquare, profile: UserRound };

function Shell() {
  const { phase, isPremium, toast, openRitual, paywall, closePaywall, ritualOpen, closeRitual } = useApp();
  const [view, setView] = useState<TabView>("home");
  const [chatPrompt, setChatPrompt] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Android back button: close what is open, then go back to Início, and only then leave the app.
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (paywall) { closePaywall(); return true; }
      if (ritualOpen) { closeRitual(); return true; }
      if (phase === "ready" && view !== "home") { setView("home"); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [paywall, ritualOpen, phase, view, closePaywall, closeRitual]);
  let body: React.ReactNode;

  if (phase === "loading") body = <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={C.gold} size="large"/></View>;
  else if (phase === "signedOut") body = <AuthFlow/>;
  else if (phase === "onboarding") body = <Onboarding/>;
  else {
    const locked = !isPremium && !FREE_VIEWS.includes(view);
    body = <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {locked ? <Locked view={view} onDiagnostic={() => setView("diagnostic")}/>
          : view === "home" ? <HomeScreen go={setView}/>
          : view === "signals" ? <SignalsScreen/>
          : view === "signs" ? <SignsScreen ask={(prompt) => { setChatPrompt(prompt); setView("chat"); }}/>
          : view === "tree" ? <TreeScreen go={setView} openRitual={openRitual}/>
          : view === "missions" ? <JourneyScreen/>
          : view === "journal" ? <JournalScreen/>
          : view === "diagnostic" ? <DiagnosticScreen go={setView}/>
          : view === "community" ? <CommunityScreen/>
          : view === "radar" ? <RadarScreen go={setView}/>
          : view === "chat" ? <ChatScreen go={setView} initialPrompt={chatPrompt} onPromptUsed={() => setChatPrompt(null)}/>
          : view === "profile" ? <ProfileScreen go={setView}/>
          : view === "premium" ? <PremiumScreen/>
          : <PremiumScreen/>}
      </View>
      <View style={{ flexDirection: "row", backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.lineSoft, paddingBottom: Math.max(insets.bottom, 6), paddingTop: 6 }}>
        {TABS.map(({ view: tab, label }) => {
          const Icon = ICONS[tab];
          const active = view === tab;
          const lock = !isPremium && !FREE_VIEWS.includes(tab);
          return <Pressable key={tab} onPress={() => setView(tab)} accessibilityRole="tab" accessibilityState={{ selected: active }} style={{ flex: 1, alignItems: "center", gap: 3, paddingVertical: 4 }}>
            <View>
              <Icon size={20} color={active ? C.gold : C.ink3}/>
              {lock && <View style={{ position: "absolute", right: -7, top: -5 }}><Lock size={9} color={C.gold}/></View>}
            </View>
            <Text numberOfLines={1} style={{ fontFamily: active ? F.black : F.bold, fontSize: 10, color: active ? C.gold : C.ink3 }}>{label}</Text>
          </Pressable>;
        })}
      </View>
    </View>;
  }
  return <View style={{ flex: 1, backgroundColor: C.bg }}>
    {body}
    <RitualModal/>
    <PaywallModal/>
    <Toast message={toast}/>
  </View>;
}

export default function App() {
  useEffect(() => watchForUpdates(), []);
  const [loaded] = useFonts({ Cinzel_600SemiBold, Manrope_500Medium, Manrope_700Bold, Manrope_800ExtraBold });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.bg }}/>;
  return <SafeAreaProvider>
    <StatusBar style="light"/>
    <AppProvider><Shell/></AppProvider>
  </SafeAreaProvider>;
}

