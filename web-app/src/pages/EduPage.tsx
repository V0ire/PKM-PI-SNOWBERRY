import { useState } from "react";
import { ChevronDown, GraduationCap } from "lucide-react";
import { SectionHero } from "../components/SectionHero";
import { EDU_SECTIONS } from "../data/education";

export function EduPage({ onBack }: { onBack: () => void }) {
  // Accordion: satu bagian terbuka, sisanya ringkas. Layar petani kecil.
  const [openId, setOpenId] = useState<string>(EDU_SECTIONS[0].id);

  return (
    <div className="page-stack">
      <SectionHero eyebrow="Edukasi" title="Panduan Stroberi Putih">
        <p>Bacaan singkat untuk merawat tanaman sehari-hari.</p>
      </SectionHero>

      <section className="card edu-list">
        {EDU_SECTIONS.map((section) => {
          const open = openId === section.id;
          return (
            <article key={section.id} className={open ? "edu-item open" : "edu-item"}>
              <button
                type="button"
                className="edu-toggle"
                aria-expanded={open}
                aria-controls={`edu-panel-${section.id}`}
                onClick={() => setOpenId(open ? "" : section.id)}
              >
                <span>
                  <strong>{section.title}</strong>
                  <em>{section.summary}</em>
                </span>
                <ChevronDown size={20} aria-hidden="true" />
              </button>
              {open && (
                <ul id={`edu-panel-${section.id}`}>
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </section>

      <section className="card edu-footer">
        <GraduationCap size={22} aria-hidden="true" />
        <p>Angka batas aman mengikuti menu Pengaturan Anda.</p>
        <button className="btn outline" type="button" onClick={onBack}>
          Kembali ke Tanaman
        </button>
      </section>
    </div>
  );
}
