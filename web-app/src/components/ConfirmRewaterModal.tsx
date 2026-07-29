import { Droplets } from "lucide-react";

export function ConfirmRewaterModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="rewater-title">
        <span className="modal-icon">
          <Droplets size={22} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <p className="eyebrow">Penyiraman Ulang</p>
        <h2 id="rewater-title">Siram kembali?</h2>
        <p>Pompa sudah menyiram, tetapi media belum cukup basah. Pastikan air tandon dan jalur pompa sudah diperiksa.</p>
        <div className="modal-actions">
          <button className="btn outline" type="button" onClick={onCancel}>Batal</button>
          <button className="btn primary" type="button" onClick={onConfirm}>Ya, Siram</button>
        </div>
      </section>
    </div>
  );
}
