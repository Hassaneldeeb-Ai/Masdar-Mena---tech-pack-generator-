export type PatchFn = (
  patches: { field: string; value: unknown; reason?: string }[]
) => Promise<void>;
