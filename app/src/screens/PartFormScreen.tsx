import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MachinesStackParamList } from "../navigation/MachinesStack";
import { apiDelete, apiGet, apiPatch, apiPost } from "../api/client";
import { partSchema, type PartFormValues } from "../schemas/logs";
import { Screen, FormField, PriceField, ReceiptsField, type ReceiptItem, Button, Text } from "../ui";

type Props = NativeStackScreenProps<MachinesStackParamList, "PartForm">;

export function PartFormScreen({ route, navigation }: Props) {
  const { machineId, part } = route.params;
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [receiptsError, setReceiptsError] = useState<string | null>(null);

  // The passport only carries receipt ids, so an existing part's images are fetched here, once,
  // when its edit form opens.
  useEffect(() => {
    if (!part) return;
    apiGet<{ id: string; image: string }[]>(`/parts/${part.id}/receipts`)
      .then((rows) => setReceipts(rows.map((r) => ({ id: r.id, image: r.image }))))
      .catch((err) => setReceiptsError(err instanceof Error ? err.message : "Couldn't load receipts"));
  }, [part]);

  const { control, handleSubmit, formState, setError } = useForm<PartFormValues>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      partNumber: part?.partNumber ?? "",
      description: part?.description ?? "",
      cost: part ? (part.costCents / 100).toFixed(2) : "",
    },
  });

  // Editing an existing part: the part already has an id, so a receipt can be attached/removed
  // immediately (its own action, independent of "Save changes" below) instead of only taking
  // effect on submit. Creating a new part: there's no id to attach to yet, so new photos are
  // just held in local state here and sent together with the initial POST /parts on submit.
  async function handleAddReceipt(image: string) {
    if (part) {
      try {
        const created = await apiPost<{ id: string; image: string }>(`/parts/${part.id}/receipts`, { image });
        setReceipts((prev) => [...prev, { id: created.id, image: created.image }]);
      } catch (err) {
        setError("root", { message: err instanceof Error ? err.message : "Could not upload receipt" });
      }
    } else {
      setReceipts((prev) => [...prev, { image }]);
    }
  }

  async function handleRemoveReceipt(item: ReceiptItem) {
    if (item.id) {
      try {
        await apiDelete(`/parts/${part!.id}/receipts/${item.id}`);
      } catch (err) {
        setError("root", { message: err instanceof Error ? err.message : "Could not delete receipt" });
        return;
      }
    }
    setReceipts((prev) => prev.filter((r) => r !== item));
  }

  async function onSubmit(values: PartFormValues) {
    try {
      const costCents = Math.round(parseFloat(values.cost || "0") * 100);
      const description = values.description || undefined;
      if (part) {
        await apiPatch(`/parts/${part.id}`, { partNumber: values.partNumber, description, costCents });
      } else {
        await apiPost("/parts", {
          machineId,
          partNumber: values.partNumber,
          description,
          costCents,
          receiptImages: receipts.map((r) => r.image),
        });
      }
      navigation.goBack();
    } catch (err) {
      setError("root", { message: err instanceof Error ? err.message : "Could not save part" });
    }
  }

  return (
    <Screen edges={["bottom"]} scroll>
      {formState.errors.root ? <Text className="text-danger-600">{formState.errors.root.message}</Text> : null}
      <FormField control={control} name="partNumber" label="Part number" placeholder="e.g. AF-2210" />
      <FormField control={control} name="description" label="Description (optional)" />
      <PriceField control={control} name="cost" label="Cost" />
      {receiptsError ? <Text className="text-danger-600">{receiptsError}</Text> : null}
      <ReceiptsField items={receipts} onAdd={handleAddReceipt} onRemove={handleRemoveReceipt} />
      <Button title={part ? "Save changes" : "Add Part"} onPress={() => handleSubmit(onSubmit)()} loading={formState.isSubmitting} />
    </Screen>
  );
}
