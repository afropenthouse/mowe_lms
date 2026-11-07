"use client";
import { useState } from "react";
import { Send, ShieldCheck, LoaderCircle } from "lucide-react";
import { authRequest } from "../../lib/auth";
export default function AdminInvite({
  onInvited,
}: { onInvited?: () => void } = {}) {
  const [email, setEmail] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="panel profile-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const result = await authRequest("/admin-invitations", { email });
          setMessage(result.message);
          setEmail("");
          onInvited?.();
        } catch (e) {
          setMessage(
            e instanceof Error ? e.message : "Unable to send invitation.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>
        <ShieldCheck size={22} /> Invite an administrator
      </h2>
      <p>
        Send a private, one-use registration invitation. The recipient must
        verify their email before signing in.
      </p>
      <label>
        Email address
        <input
          type="email"
          value={email}
          required
          disabled={busy}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@example.com"
        />
      </label>
      <button className="btn" disabled={busy}>
        {busy ? (
          <LoaderCircle size={16} className="spin" />
        ) : (
          <Send size={16} />
        )}
        {busy ? "Sending…" : "Send invitation"}
      </button>
      {message && (
        <p role="status" style={{ marginTop: 15 }}>
          {message}
        </p>
      )}
    </form>
  );
}
