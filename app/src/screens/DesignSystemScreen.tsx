import { useState, type ReactNode } from "react";
import { View } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import clsx from "clsx";
import {
  Screen,
  Text,
  Button,
  FormField,
  PriceField,
  CheckboxField,
  SelectField,
  ReceiptsField,
  type ReceiptItem,
  ConfirmDialog,
  Card,
  EmptyState,
  Badge,
  Accordion,
  Tabs,
  QuickActions,
  Dropdown,
  SearchField,
  Sheet,
  VoiceInputButton,
} from "../ui";
import { usePersistedColorScheme, type AppColorScheme } from "../theme/colorScheme";

// Every color/size/variant combo below is spelled out as a literal className string on
// purpose — NativeWind/Tailwind finds classes by scanning source text, not by evaluating
// template literals, so `bg-${tone}-${shade}` would silently produce nothing.

const PALETTE: { name: string; classes: string[] }[] = [
  { name: "primary", classes: ["bg-primary-100", "bg-primary-300", "bg-primary-500", "bg-primary-600", "bg-primary-700"] },
  { name: "neutral", classes: ["bg-neutral-100", "bg-neutral-300", "bg-neutral-500", "bg-neutral-600", "bg-neutral-700"] },
  { name: "success", classes: ["bg-success-100", "bg-success-300", "bg-success-500", "bg-success-600", "bg-success-700"] },
  { name: "warning", classes: ["bg-warning-100", "bg-warning-300", "bg-warning-500", "bg-warning-600", "bg-warning-700"] },
  { name: "danger", classes: ["bg-danger-100", "bg-danger-300", "bg-danger-500", "bg-danger-600", "bg-danger-700"] },
];

const BUTTON_VARIANTS = ["primary", "secondary", "outline", "danger", "ghost", "fancy", "industrial"] as const;
const BADGE_TONES = ["primary", "neutral", "success", "warning", "danger"] as const;

const ROLE_OPTIONS = [
  { label: "Admin", value: "ADMIN" },
  { label: "Manager", value: "MANAGER" },
  { label: "Mechanic", value: "MECHANIC" },
  { label: "Driver", value: "DRIVER" },
];

const demoFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.string().min(1, "Price is required"),
  role: z.string().min(1, "Pick a role"),
  agree: z.boolean().refine((v) => v === true, { message: "You must agree to continue" }),
});
type DemoFormValues = z.infer<typeof demoFormSchema>;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text variant="heading">{title}</Text>
      <View className="gap-3">{children}</View>
      <View className="mt-1 h-px bg-neutral-200 dark:bg-neutral-800" />
    </View>
  );
}

const THEME_TABS: { key: AppColorScheme; label: string }[] = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
];

export function DesignSystemScreen() {
  const { colorScheme, setColorScheme } = usePersistedColorScheme();
  const { control, handleSubmit } = useForm<DemoFormValues>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: { name: "", price: "", role: "", agree: false },
  });
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("one");
  const [iconTab, setIconTab] = useState("fleet");
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [transcript, setTranscript] = useState("");

  return (
    <Screen scroll>
      <View className="gap-1">
        <Text variant="title">HEOS UI Kit</Text>
        <Text variant="muted">Every shared component in app/src/ui, in one place.</Text>
      </View>

      <View className="rounded-card border border-warning-300 bg-warning-100 p-3 dark:border-warning-700 dark:bg-warning-900">
        <Text className="text-sm text-warning-800 dark:text-warning-200">
          This page isn't password-protected yet — don't link it anywhere public.
        </Text>
      </View>

      <Section title="Theme">
        <Tabs tabs={THEME_TABS} activeKey={colorScheme} onChange={(key) => setColorScheme(key as AppColorScheme)} />
        <Text variant="muted">Also available in Settings — this is here for quick visual testing.</Text>
      </Section>

      <Section title="Colors">
        <View className="gap-3">
          {PALETTE.map((group) => (
            <View key={group.name} className="gap-1.5">
              <Text variant="label" className="capitalize">
                {group.name}
              </Text>
              <View className="flex-row gap-2">
                {group.classes.map((cls) => (
                  <View key={cls} className={clsx("size-10 rounded-card border border-neutral-200 dark:border-neutral-800", cls)} />
                ))}
              </View>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Typography">
        <View className="gap-2">
          <Text variant="title">Title — Text variant="title"</Text>
          <Text variant="heading">Heading — Text variant="heading"</Text>
          <Text variant="body">Body — Text variant="body"</Text>
          <Text variant="label">Label — Text variant="label"</Text>
          <Text variant="muted">Muted — Text variant="muted"</Text>
        </View>
      </Section>

      <Section title="Buttons">
        <View className="gap-2">
          {BUTTON_VARIANTS.map((variant) => (
            <View key={variant} className="flex-row items-center gap-2">
              <Button variant={variant} size="md" title={variant} onPress={() => {}} />
              <Button variant={variant} size="sm" title={variant} onPress={() => {}} />
            </View>
          ))}
          <View className="flex-row items-center gap-2">
            <Button title="Loading" onPress={() => {}} loading />
            <Button title="Disabled" onPress={() => {}} disabled />
          </View>
        </View>
      </Section>

      <Section title="Badges">
        <View className="flex-row flex-wrap gap-2">
          {BADGE_TONES.map((tone) => (
            <Badge key={tone} tone={tone} label={tone} />
          ))}
        </View>
      </Section>

      <Section title="Card">
        <Card>
          <Text variant="heading">Card title</Text>
          <Text variant="muted">Cards are the base container for grouped content — a bordered, padded, white box.</Text>
        </Card>
      </Section>

      <Section title="Accordion">
        <Accordion tone="danger" title="3 machines due for maintenance">
          <Text variant="muted">Collapsible content goes here — see the Dashboard screen for the full row pattern.</Text>
        </Accordion>
        <Accordion tone="warning" title="Starts collapsed" defaultExpanded={false}>
          <Text variant="muted">This one starts closed — tap the header to expand.</Text>
        </Accordion>
      </Section>

      <Section title="Empty state">
        <Card>
          <EmptyState title="No machines yet" subtitle="Add your first machine to get started." />
        </Card>
      </Section>

      <Section title="Tabs">
        <Tabs
          tabs={[
            { key: "one", label: "One" },
            { key: "two", label: "Two" },
            { key: "three", label: "Three" },
          ]}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
        <Text variant="muted">Showing: {activeTab}</Text>
        <Tabs
          variant="icon"
          tabs={[
            { key: "fleet", label: "Fleet", icon: "construct" },
            { key: "dashboard", label: "Dashboard", icon: "grid" },
            { key: "settings", label: "Settings", icon: "settings" },
          ]}
          activeKey={iconTab}
          onChange={setIconTab}
        />
      </Section>

      <Section title="Quick actions">
        <QuickActions
          actions={[
            { title: "Log Repair", onPress: () => setLastAction("Log Repair") },
            { title: "Add Note", variant: "secondary", onPress: () => setLastAction("Add Note") },
            { title: "Record Hours", onPress: () => setLastAction("Record Hours") },
            { title: "Diagnostics", variant: "secondary", onPress: () => setLastAction("Diagnostics") },
          ]}
        />
        <Text variant="muted">Last tapped: {lastAction ?? "—"}</Text>
      </Section>

      <Section title="Confirm dialog">
        <Button variant="danger" title="Delete something" onPress={() => setConfirmOpen(true)} />
        <ConfirmDialog
          visible={confirmOpen}
          title="Delete this record?"
          message="This can't be undone."
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => setConfirmOpen(false)}
        />
      </Section>

      <Section title="Form fields">
        <FormField control={control} name="name" label="Name" placeholder="Jane Smith" />
        <PriceField control={control} name="price" label="Price" />
        <SelectField control={control} name="role" label="Role" options={ROLE_OPTIONS} />
        <CheckboxField control={control} name="agree" label="I agree to the terms" />
        <Button variant="secondary" title="Validate (show errors)" onPress={() => handleSubmit(() => {})()} />
      </Section>

      <Section title="Receipts field">
        <ReceiptsField
          items={receipts}
          onAdd={(image) => setReceipts((prev) => [...prev, { image }])}
          onRemove={(item) => setReceipts((prev) => prev.filter((i) => i !== item))}
        />
      </Section>

      <Section title="Search field">
        <SearchField value={search} onChangeText={setSearch} placeholder="Search machines…" />
        <Text variant="muted">Plain value/onChange — for live filter bars, not react-hook-form.</Text>
      </Section>

      <Section title="Dropdown">
        <Dropdown
          label="Location"
          value={filterLocation}
          onChange={setFilterLocation}
          options={[
            { label: "Hardeeville Yard", value: "hardeeville" },
            { label: "Savannah Yard", value: "savannah" },
          ]}
        />
      </Section>

      <Section title="Voice input">
        <View className="gap-1.5">
          <View className="flex-row items-center justify-between">
            <Text variant="label">Dictate a note</Text>
            <VoiceInputButton onTranscript={(text) => setTranscript((prev) => (prev ? `${prev} ${text}`.trim() : text))} />
          </View>
          <Text variant="muted">{transcript || "Tap the mic and speak — same affordance FormField's voice prop uses."}</Text>
        </View>
      </Section>

      <Section title="Sheet">
        <Button variant="secondary" title="Open a sheet" onPress={() => setSheetOpen(true)} />
        <Sheet visible={sheetOpen} title="Example sheet" onClose={() => setSheetOpen(false)}>
          <Text variant="muted">Slide-up panel used for quick actions and chat — content mounts fresh each time it opens.</Text>
        </Sheet>
      </Section>
    </Screen>
  );
}
