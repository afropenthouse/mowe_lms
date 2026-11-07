"use client";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, LoaderCircle } from "lucide-react";
import { authRequest } from "../lib/auth";
import { Button } from "./ui";

function PasswordInput({
  label,
  name,
  value,
  onChange,
  current = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  current?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label>
      {label}
      <span className="profile-password-input">
        <input
          name={name}
          aria-label={label}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete={current ? "current-password" : "new-password"}
          minLength={current ? 1 : 8}
          maxLength={current ? 128 : 12}
        />
        <button
          type="button"
          aria-label={(visible ? "Hide " : "Show ") + label.toLowerCase()}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}
export default function ChangePassword({ busy }: { busy: boolean }) {
  const [currentPassword, setCurrent] = useState(""),
    [newPassword, setNew] = useState(""),
    [confirmPassword, setConfirm] = useState("");
  const [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const result = await authRequest("/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrent("");
      setNew("");
      setConfirm("");
      setSuccess(result.message);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to update your password.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="panel profile-section profile-split-section">
      <header>
        <h2>Account security</h2>
        <p>
          Update your password to keep your account secure. Use 8–12 characters.
        </p>
      </header>
      <form onSubmit={submit} className="profile-password-form">
        <fieldset disabled={saving || busy}>
          <PasswordInput
            label="Current password"
            name="currentPassword"
            value={currentPassword}
            onChange={setCurrent}
            current
          />
          <PasswordInput
            label="New password"
            name="newPassword"
            value={newPassword}
            onChange={setNew}
          />
          <PasswordInput
            label="Confirm new password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={setConfirm}
          />
          {error && (
            <p className="feedback error" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="feedback success" role="status">
              {success}
            </p>
          )}
          <p className="profile-field-hint">
            Changing your password logs you out on other devices.
          </p>
          <div className="profile-form-actions">
            <Button type="submit" disabled={saving || busy}>
              {saving ? (
                <LoaderCircle size={17} className="spin" />
              ) : (
                <LockKeyhole size={17} />
              )}{" "}
              {saving ? "Updating password…" : "Update password"}
            </Button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
