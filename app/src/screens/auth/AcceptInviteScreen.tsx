import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../auth/AuthContext";
import { acceptInviteSchema, type AcceptInviteFormValues } from "../../schemas/auth";
import { Screen, Text, FormField, Button } from "../../ui";

// Redeems a code an org admin generated from the Team screen.
export function AcceptInviteScreen() {
  const { acceptInvite } = useAuth();
  const { control, handleSubmit, formState, setError } = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { code: "", name: "", email: "", password: "" },
  });

  async function onSubmit(values: AcceptInviteFormValues) {
    try {
      await acceptInvite(values.code, values.name, values.email, values.password);
    } catch (err) {
      setError("root", { message: err instanceof Error ? err.message : "Could not join organization" });
    }
  }

  return (
    <Screen scroll edges={["bottom"]}>
      <Text variant="title">Join with an invite code</Text>
      {formState.errors.root ? <Text className="text-danger-600">{formState.errors.root.message}</Text> : null}
      <FormField control={control} name="code" label="Invite code" autoCapitalize="none" />
      <FormField control={control} name="name" label="Your name" />
      <FormField control={control} name="email" label="Email" autoCapitalize="none" keyboardType="email-address" />
      <FormField control={control} name="password" label="Password (min 8 characters)" secureTextEntry />
      <Button title="Join organization" onPress={handleSubmit(onSubmit)} loading={formState.isSubmitting} />
    </Screen>
  );
}
