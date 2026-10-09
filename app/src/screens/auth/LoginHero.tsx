import { useEffect } from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { primary, neutral, white } from "../../theme/palette";

// A handful of soft dust motes drifting slowly upward through the glow — kept to five, small,
// and slow so it reads as atmosphere rather than a distraction.
const MOTES = [
  { left: "12%", size: 4, delay: 0, duration: 7000 },
  { left: "27%", size: 3, delay: 1400, duration: 6200 },
  { left: "52%", size: 5, delay: 2600, duration: 8000 },
  { left: "71%", size: 3, delay: 700, duration: 6800 },
  { left: "88%", size: 4, delay: 2000, duration: 7400 },
] as const;

function Mote({ left, size, delay, duration }: (typeof MOTES)[number]) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false));
  }, [delay, duration, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.1, 0.8, 1], [0, 0.8, 0.6, 0]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [0, -260]) }],
  }));

  return (
    <Animated.View
      style={[
        style,
        { position: "absolute", bottom: "20%", left, width: size, height: size, borderRadius: size / 2, backgroundColor: white },
      ]}
    />
  );
}

// One breathing ring — grows/shrinks and fades in/out on its own slow, independent cycle. Several
// of these at staggered durations/delays is what makes the glow feel like layered, tranquil
// breathing instead of one mechanical pulse.
function PulsingCircle({
  containerSize,
  size,
  color,
  opacity,
  duration,
  delay = 0,
}: {
  containerSize: number;
  size: number;
  color: string;
  opacity: number;
  duration: number;
  delay?: number;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [delay, duration, pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [opacity * 0.4, opacity]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.92, 1.1]) }],
  }));

  const offset = (containerSize - size) / 2;
  return (
    <Animated.View
      style={[
        style,
        { position: "absolute", top: offset, left: offset, width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    />
  );
}

// A slow breathing glow standing in for a rising sun — three concentric rings, warmest/brightest
// at the center, each drifting in and out of phase with the others on its own slow cycle.
function SunGlow() {
  return (
    <View style={{ position: "absolute", top: "50%", left: "50%", marginTop: -160, marginLeft: -160, width: 320, height: 320 }}>
      <PulsingCircle containerSize={320} size={320} color={primary[200]} opacity={0.14} duration={4800} />
      <PulsingCircle containerSize={320} size={220} color={primary[100]} opacity={0.2} duration={3900} delay={500} />
      <PulsingCircle containerSize={320} size={120} color={white} opacity={0.28} duration={3200} delay={1000} />
    </View>
  );
}

// Dawn breaking over the yard — sky gradient, a breathing sun glow centered on the screen, and a
// few drifting dust motes. The whole point of a login screen for a fleet app: the workday's about
// to start.
export function LoginHero() {
  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      <LinearGradient
        colors={[neutral[950], primary[900], primary[600], primary[400], primary[200]]}
        locations={[0, 0.35, 0.6, 0.8, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SunGlow />
      {MOTES.map((mote) => (
        <Mote key={mote.left} {...mote} />
      ))}
    </View>
  );
}
