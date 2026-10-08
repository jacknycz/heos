import { Platform, Text, TextStyle, View } from "react-native";
import { primary } from "../../theme/palette";

// A fake mark, no font file required — one oversized, tilted, glowing "H". The glow is a text
// shadow: web takes the CSS textShadow string, native takes the textShadow* props.
export function LoginLogo({ size = 68 }: { size?: number }) {
  const glowRadius = size * 0.3;
  const glow: TextStyle =
    Platform.OS === "web"
      ? ({ textShadow: `0px 0px ${glowRadius}px ${primary[300]}` } as TextStyle)
      : { textShadowColor: primary[300], textShadowRadius: glowRadius, textShadowOffset: { width: 0, height: 0 } };

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Text
        style={{
          fontSize: size,
          fontWeight: "900",
          color: primary[200],
          transform: [{ rotate: "-8deg" }],
          ...glow,
        }}
      >
        H
      </Text>
    </View>
  );
}
