import { View } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthStack";
import { useAuth } from "../../auth/AuthContext";
import { loginSchema, type LoginFormValues } from "../../schemas/auth";
import { Screen, Text, FormField, Button } from "../../ui";
import { LoginHero } from "./LoginHero";
import { LoginLogo } from "./LoginLogo";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { control, handleSubmit, formState, setError } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values.email, values.password);
    } catch (err) {
      setError("root", { message: err instanceof Error ? err.message : "Login failed" });
    }
  }

  return (
    <Screen padded={false}>
      <LoginHero />
      <View className="flex-1 justify-center gap-4 p-6">
        <View className="mb-2">
          <LoginLogo />
        </View>
        {formState.errors.root ? <Text className="text-danger-200">{formState.errors.root.message}</Text> : null}
        <FormField control={control} name="email" label="Email" labelClassName="text-white" autoCapitalize="none" keyboardType="email-address" />
        <FormField control={control} name="password" label="Password" labelClassName="text-white" secureTextEntry />
        <Button title="Log in" variant="fancy" className="mt-4" onPress={() => handleSubmit(onSubmit)()} loading={formState.isSubmitting} />
        <View className="mt-4 gap-2">
          <Button
            title="Create a new organization"
            variant="ghost"
            textClassName="text-white"
            onPress={() => navigation.navigate("CreateOrganization")}
          />
          <Button title="I have an invite code" variant="ghost" textClassName="text-white" onPress={() => navigation.navigate("AcceptInvite")} />
        </View>
      </View>
    </Screen>
  );
}
