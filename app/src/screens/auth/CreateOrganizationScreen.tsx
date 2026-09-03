import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../auth/AuthContext";
import { createOrganizationSchema, type CreateOrganizationFormValues } from "../../schemas/auth";
import { Screen, Text, FormField, Button } from "../../ui";

// Bootstraps a brand-new organization with the submitter as its first admin.
export function CreateOrganizationScreen() {
  const { signupOrganization } = useAuth();
  const { control, handleSubmit, formState, setError } = useForm<CreateOrganizationFormValues>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: { organizationName: "", name: "", email: "", password: "" },
  });

  async function onSubmit(values: CreateOrganizationFormValues) {
    try {
      await signupOrganization(values.organizationName, values.name, values.email, values.password);
    } catch (err) {
      setError("root", { message: err instanceof Error ? err.message : "Could not create organization" });
    }
  }

  return (
    <Screen scroll edges={["bottom"]}>
      <Text variant="title">Create your organization</Text>
      <Text variant="muted">You'll be the first admin — you can invite the rest of your team afterward.</Text>
      {formState.errors.root ? <Text className="text-danger-600">{formState.errors.root.message}</Text> : null}
      <FormField control={control} name="organizationName" label="Organization name" />
      <FormField control={control} name="name" label="Your name" />
      <FormField control={control} name="email" label="Email" autoCapitalize="none" keyboardType="email-address" />
      <FormField control={control} name="password" label="Password (min 8 characters)" secureTextEntry />
      <Button title="Create organization" onPress={handleSubmit(onSubmit)} loading={formState.isSubmitting} />
    </Screen>
  );
}
