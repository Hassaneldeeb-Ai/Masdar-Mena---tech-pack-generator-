import type { Project } from "@/lib/schemas/tech-pack";
import { FieldValueView } from "./field-editor";
import { MaterialGsmAdder } from "./gsm-adder";
import { SupplierAdder } from "./supplier-adder";
import type { PatchFn } from "./types";

export function BomTab({ project, onPatch }: { project: Project; onPatch: PatchFn }) {
  const pack = project.tech_pack!;
  const numericConsumptions = pack.bom
    .map((b) => (typeof b.consumption === "number" ? b.consumption : Number(b.consumption)))
    .filter((v) => Number.isFinite(v) && v > 0);
  const maxConsumption = numericConsumptions.length ? Math.max(...numericConsumptions) : 0;

  return (
    <div className="animate-fade-up space-y-10">
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
            Bill of materials
          </h3>
          <p className="font-mono text-[11px] text-ink-soft">
            Estimated consumption — confirm against the approved pattern and marker.
          </p>
        </div>
        <div className="overflow-x-auto rounded-[24px] border border-ink/10 bg-sheet shadow-sheet">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink bg-paper font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                <th className="px-3 py-2.5 font-medium">#</th>
                <th className="px-3 py-2.5 font-medium">Component</th>
                <th className="px-3 py-2.5 font-medium">Material</th>
                <th className="px-3 py-2.5 font-medium">Specification</th>
                <th className="px-3 py-2.5 text-right font-medium">Unit</th>
                <th className="px-3 py-2.5 text-right font-medium">Consumption</th>
                <th className="px-3 py-2.5 font-medium">Colour</th>
                <th className="px-3 py-2.5 font-medium">Supplier</th>
                <th className="px-3 py-2.5 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {pack.bom.map((b, i) => {
                const n =
                  typeof b.consumption === "number"
                    ? b.consumption
                    : Number(b.consumption);
                const w =
                  Number.isFinite(n) && n > 0 && maxConsumption > 0
                    ? Math.max(6, (n / maxConsumption) * 100)
                    : null;
                return (
                  <tr
                    key={b.id}
                    className="animate-fade-up border-b border-ink/10 transition-colors last:border-b-0 hover:bg-secondary/40"
                    style={{ ["--d" as string]: `${i * 70}ms` }}
                  >
                    <td className="px-3 py-3 font-mono text-xs text-ink-soft">{b.position}</td>
                    <td className="px-3 py-3 font-medium">{b.component_name}</td>
                    <td className="px-3 py-3">{b.material_name}</td>
                    <td className="px-3 py-3 text-ink-soft">{b.specification}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs">{b.unit}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {w !== null && (
                          <span
                            aria-hidden
                            className="animate-bar-grow hidden h-1.5 w-16 bg-ink/20 md:block"
                            style={{ ["--d" as string]: `${i * 90}ms` }}
                          >
                            <span className="block h-full bg-signal" style={{ width: `${w}%` }} />
                          </span>
                        )}
                        <span className="font-mono text-xs font-semibold">{b.consumption}</span>
                        {b.consumption_is_estimated && (
                          <span className="rounded-full border border-signal/40 bg-signal/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-signal-deep">
                            est.
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {b.color ? (
                        <span className="font-mono text-xs">{b.color}</span>
                      ) : (
                        <span className="font-mono text-xs text-ink-soft">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-ink-soft">
                      {b.supplier ?? "TBD"}
                    </td>
                    <td className="max-w-[260px] px-3 py-3 text-xs text-ink-soft">{b.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
          Materials
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pack.materials.map((m, i) => (
            <div
              key={m.id}
              className="animate-fade-up space-y-3 rounded-[24px] border border-ink/10 bg-sheet p-4 shadow-sheet transition-colors duration-300 hover:border-signal/40"
              style={{ ["--d" as string]: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between gap-2 border-b border-dashed border-ink/20 pb-3">
                <div>
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                    {m.type}
                  </p>
                </div>
                {m.color && (
                  <span className="flex items-center gap-1.5 rounded-full border border-ink/20 bg-paper px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                    <span
                      aria-hidden
                      className="inline-block size-2.5 rounded-full border border-ink/20"
                      style={{ backgroundColor: /^#/.test(m.color) ? m.color : "transparent" }}
                    />
                    {m.color}
                  </span>
                )}
              </div>
              <FieldValueView
                label="Composition"
                fieldPath={`materials.${i}.composition`}
                value={m.composition}
                onPatch={onPatch}
              />
              {m.gsm && (
                <FieldValueView
                  label="Weight (GSM)"
                  fieldPath={`materials.${i}.gsm`}
                  value={m.gsm}
                  onPatch={onPatch}
                />
              )}
              {m.type === "fabric" && !m.gsm && (
                <div className="rounded-2xl border border-signal/40 bg-signal/5 p-2.5 text-xs text-signal-deep">
                  ⚠ Fabric weight (GSM) not specified — request from supplier.
                  <div className="mt-2">
                    <MaterialGsmAdder
                      onPatch={onPatch}
                      fieldPath={`materials.${i}.gsm`}
                      label="Add GSM"
                    />
                  </div>
                </div>
              )}
              {m.width_cm && (
                <FieldValueView
                  label="Roll width (cm)"
                  fieldPath={`materials.${i}.width_cm`}
                  value={m.width_cm}
                  onPatch={onPatch}
                />
              )}
              {m.notes && (
                <p className="border-t border-dashed border-ink/20 pt-2.5 text-xs leading-relaxed text-ink-soft">
                  {m.notes}
                </p>
              )}
              {m.supplier && (
                <div className="border-t border-dashed border-ink/20 pt-2.5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-signal">
                    Supplier
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {m.supplier.name}
                    {m.supplier.material_code ? (
                      <span className="ml-2 font-mono text-[10px] font-medium text-ink-soft">
                        {m.supplier.material_code}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-1.5">
                    {m.supplier.country ? <Chip>{m.supplier.country}</Chip> : null}
                    {m.supplier.moq ? <Chip>MOQ {m.supplier.moq}</Chip> : null}
                    {m.supplier.lead_time_days ? <Chip>L/T {m.supplier.lead_time_days}d</Chip> : null}
                    {m.supplier.price ? <Chip>{m.supplier.price} {m.supplier.currency}</Chip> : null}
                    {m.supplier.certification ? <Chip>{m.supplier.certification}</Chip> : null}
                  </p>
                  <p className="mt-1.5 flex items-center gap-2">
                    <span
                      className={
                        "rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold " +
                        (m.supplier.approval_status === "APPROVED"
                          ? "border-emerald-600/40 bg-emerald-50 text-emerald-700"
                          : m.supplier.approval_status === "REJECTED"
                            ? "border-red-600/40 bg-red-50 text-red-700"
                            : "border-signal/40 bg-signal/10 text-signal-deep")
                      }
                    >
                      {m.supplier.approval_status}
                    </span>
                    <SupplierAdder
                      onPatch={onPatch}
                      fieldPath={`materials.${i}.supplier`}
                      supplier={m.supplier}
                    />
                  </p>
                </div>
              )}
              {!m.supplier && (
                <div className="border-t border-dashed border-ink/20 pt-2.5">
                  <SupplierAdder onPatch={onPatch} fieldPath={`materials.${i}.supplier`} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-ink/15 bg-paper px-2 py-0.5 font-mono text-[9px] text-ink-soft">
      {children}
    </span>
  );
}
