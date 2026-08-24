import { Leaf } from "lucide-react";
import { useState } from "react";

// Pesan error Firebase diterjemahkan ke bahasa petani (UI_UX §13).
function loginErrorMessage(code: string): string {
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "Email atau kata sandi belum benar.";
  }
  if (code === "auth/too-many-requests") {
    return "Percobaan masuk terlalu banyak. Coba lagi beberapa menit lagi.";
  }
  if (code === "auth/network-request-failed") {
    return "Koneksi internet bermasalah. Periksa internet lalu coba lagi.";
  }
  if (code === "auth/invalid-email") {
    return "Format email belum benar.";
  }
  return "Gagal masuk. Periksa koneksi internet lalu coba lagi.";
}

export function LoginScreen({ onSignIn }: { onSignIn: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password || busy) return;
    setBusy(true);
    setError("");
    try {
      await onSignIn(email, password);
    } catch (err) {
      const code = typeof err === "object" && err && "code" in err ? String((err as { code: unknown }).code) : "";
      setError(loginErrorMessage(code));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="startup-screen">
      <span className="startup-mark"><Leaf size={54} strokeWidth={1.5} aria-hidden="true" /></span>
      <p className="eyebrow">Snowberry</p>
      <h1>Masuk ke Greenhouse Anda</h1>
      <p>Pantau kondisi stroberi putih dan kendalikan alat dari satu akun.</p>
      <form
        className="startup-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label className="field">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="field">
          Kata Sandi
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && (
          <p className="login-error" role="alert">{error}</p>
        )}
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? "Memproses..." : "Masuk"}
        </button>
        <p className="login-note">Alat di greenhouse tetap bekerja otomatis meski belum masuk.</p>
      </form>
    </main>
  );
}
