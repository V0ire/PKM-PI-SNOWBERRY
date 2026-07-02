import type { ActuatorKey } from "../types";
import { ACTUATOR_COPY } from "../data/mockSnowberry";

export function ConfirmManualModal({
  actuatorKey,
  onCancel,
  onConfirm,
}: {
  actuatorKey: ActuatorKey;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const copy = ACTUATOR_COPY[actuatorKey];

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="manual-title">
        <p className="eyebrow">Kontrol Manual Sementara</p>
        <h2 id="manual-title">{copy.manualModalTitle}</h2>
        <p>{copy.manualModalBody}</p>
        <div className="modal-actions">
          <button className="btn outline" type="button" onClick={onCancel}>
            Batal
          </button>
          <button className="btn primary" type="button" onClick={onConfirm}>
            Aktifkan Manual
          </button>
        </div>
      </section>
    </div>
  );
}
