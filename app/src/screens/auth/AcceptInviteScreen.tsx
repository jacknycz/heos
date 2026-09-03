import { useState } from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";
import { useAuth } from "../../auth/AuthContext";

// Redeems a code an org admin generated from the Team screen.
export function AcceptInviteScreen() {
  const { acceptInvite } = useAuth();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      await acceptInvite(code, name, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join organization");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>Join with an invite code</Text>
      {error ? <Text style={{ color: "crimson" }}>{error}</Text> : null}
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="Invite code"
        autoCapitalize="none"
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 6 }}
      />
      <TextInput value={name} onChangeText={setName} placeholder="Your name" style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 6 }} />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 6 }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password (min 8 characters)"
        secureTextEntry
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 6 }}
      />
      <Button title={submitting ? "Joining…" : "Join organization"} onPress={submit} disabled={submitting} />
    </ScrollView>
  );
}
