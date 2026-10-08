import { useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import { apiPost } from "../api/client";
import { neutral, danger } from "../theme/palette";

type Status = "idle" | "recording" | "transcribing";

// expo-av gives back a native file:// URI on iOS/Android (readable via expo-file-system) but a
// blob: URI on web, which expo-file-system can't read at all — that needs fetch + FileReader
// instead. Returns a full data URL either way so the caller doesn't need to know the difference.
async function recordingToDataUrl(uri: string): Promise<string> {
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  return `data:audio/m4a;base64,${base64}`;
}

// A mic button that records a short clip, uploads it as a base64 data URL (same pattern as
// receipt photos — see ReceiptsField), and hands the transcribed text back to the caller.
// Icon color is swapped by plain state, not animated — an animated Ionicons `color` crashed on
// web last time this was tried (see Accordion's icon handling for the same workaround).
export function VoiceInputButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const recordingRef = useRef<Audio.Recording | null>(null);

  async function startRecording() {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) return;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    recordingRef.current = recording;
    setStatus("recording");
  }

  async function stopRecording() {
    const recording = recordingRef.current;
    if (!recording) return;
    recordingRef.current = null;
    setStatus("transcribing");
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) return;
      const audio = await recordingToDataUrl(uri);
      const { text } = await apiPost<{ text: string }>("/transcribe", { audio });
      if (text) onTranscript(text);
    } finally {
      setStatus("idle");
    }
  }

  if (status === "transcribing") {
    return <ActivityIndicator size="small" color={neutral[500]} />;
  }

  return (
    <Pressable onPress={status === "recording" ? stopRecording : startRecording} hitSlop={8}>
      <Ionicons name={status === "recording" ? "stop-circle" : "mic-outline"} size={20} color={status === "recording" ? danger[600] : neutral[500]} />
    </Pressable>
  );
}
