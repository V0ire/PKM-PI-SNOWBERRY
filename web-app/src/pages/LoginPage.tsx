import { useState, type FormEvent } from "react";
import { authErrorMessage } from "../services/auth";

type Props = {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
};

export function LoginPage({ login, register }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email.includes("@")) return setError("Masukkan alamat email yang benar.");
    if (password.length < 6) return setError("Kata sandi minimal 6 karakter.");
    setBusy(true);
    try {
      await (isRegister ? register : login)(email, password);
    } catch (cause) {
      setError(authErrorMessage((cause as { code?: string }).code));
      setBusy(false);
    }
  };

  return <main className="startup-screen">
    <form className="startup-card" onSubmit={submit}>
      <p className="eyebrow">{isRegister ? "Akun Baru" : "Akun Snowberry"}</p>
      <h1>{isRegister ? "Buat akun Snowberry" : "Masuk untuk melihat greenhouse"}</h1>
      <p>{isRegister ? "Akun ini dipakai untuk mengakses satu greenhouse Snowberry." : "Gunakan akun yang terhubung dengan perangkat Snowberry Anda."}</p>
      <label className="field"><span>Alamat email</span><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" /></label>
      <label className="field"><span>Kata sandi</span><input type="password" autoComplete={isRegister ? "new-password" : "current-password"} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan kata sandi" /></label>
      {error && <p role="alert">{error}</p>}
      <button className="btn primary" disabled={busy}>{busy ? (isRegister ? "Membuat akun..." : "Sedang masuk...") : (isRegister ? "Buat Akun" : "Masuk")}</button>
      <button className="btn plain" type="button" onClick={() => { setIsRegister(!isRegister); setError(""); }}>{isRegister ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}</button>
    </form>
  </main>;
}
