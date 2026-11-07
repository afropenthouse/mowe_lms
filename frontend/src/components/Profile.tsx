"use client";
import { Camera, LoaderCircle, LogOut, Save } from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { AuthUser } from "../lib/auth";
import type { UploadedFile } from "./FileUpload";
import { Button } from "./ui";
import ChangePassword from "./ChangePassword";

type Props = {
  user: AuthUser;
  busy: boolean;
  action: (
    action: string,
    payload: unknown,
    message: string,
  ) => Promise<unknown>;
  upload: (file: File, purpose: string) => Promise<UploadedFile | null>;
  signOut: () => Promise<void>;
};
export default function Profile({
  user,
  action,
  busy,
  upload,
  signOut,
}: Props) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.profile.bio);
  const [linkedin, setLinkedin] = useState(user.profile.linkedin);
  const [photo, setPhoto] = useState(user.profile.photo);
  const [photoWorking, setPhotoWorking] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  const photoInput = useRef<HTMLInputElement>(null);
  const disabled = busy || photoWorking || leaving;

  async function savePhoto(nextPhoto: string) {
    // A photo update must not submit other edits still being typed in the form.
    const result = await action(
      "profile",
      {
        name: user.name,
        bio: user.profile.bio,
        linkedin: user.profile.linkedin,
        photo: nextPhoto,
      },
      nextPhoto ? "Profile photo updated" : "Profile photo removed",
    );
    if (result) setPhoto(nextPhoto);
  }
  async function changePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setPhotoWorking(true);
    try {
      const uploaded = await upload(file, "photo");
      if (uploaded) await savePhoto(uploaded.url);
    } finally {
      setPhotoWorking(false);
    }
  }
  async function removePhoto() {
    setPhotoWorking(true);
    try {
      await savePhoto("");
    } finally {
      setPhotoWorking(false);
    }
  }
  async function logout() {
    setLeaving(true);
    setError("");
    try {
      await signOut();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to log out. Please try again.",
      );
      setLeaving(false);
    }
  }
  async function saveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await action(
      "profile",
      { name, bio, linkedin, photo },
      "Profile details saved",
    );
  }
  return (
    <div className="profile-page">
      <header className="profile-page-heading">
        <div>
          <h1>My profile</h1>
          <p>Manage your personal information and account security.</p>
        </div>
        <button
          type="button"
          className="profile-logout"
          onClick={logout}
          disabled={disabled}
        >
          {leaving ? (
            <LoaderCircle size={17} className="spin" />
          ) : (
            <LogOut size={17} />
          )}
          {leaving ? "Logging out…" : "Log out"}
        </button>
      </header>
      {error && (
        <p className="feedback error" role="alert">
          {error}
        </p>
      )}
      <section
        className="profile-identity-card"
        aria-label="Profile picture and identity"
      >
        <div className="profile-avatar-editor">
          <button
            type="button"
            className="profile-photo-control"
            onClick={() => photoInput.current?.click()}
            disabled={disabled}
            aria-label="Update profile picture"
            aria-busy={photoWorking}
          >
            <span className="profile-photo">
              {photo ? (
                <img src={photo} alt="Your profile" />
              ) : (
                user.name[0]?.toUpperCase() || "M"
              )}
            </span>
            <span className="profile-photo-camera">
              {photoWorking ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <Camera size={16} />
              )}
            </span>
          </button>
          <input
            ref={photoInput}
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            hidden
            aria-label="Choose profile picture"
            onChange={changePhoto}
            disabled={disabled}
          />
        </div>
        <div className="profile-identity-details">
          <h2>{user.name}</h2>
          <div className="profile-identity-meta">
            <span>
              {user.isSuperAdmin
                ? "Super Admin"
                : user.role === "admin"
                  ? "Administrator"
                  : "Learner"}
            </span>
            {user.studentNumber && (
              <span className="profile-student-number">
                {user.studentNumber}
              </span>
            )}
          </div>
          <div className="profile-photo-actions">
            <button
              type="button"
              onClick={() => photoInput.current?.click()}
              disabled={disabled}
            >
              {photoWorking ? "Updating photo…" : "Change photo"}
            </button>
            {photo && (
              <button type="button" onClick={removePhoto} disabled={disabled}>
                Remove
              </button>
            )}
          </div>
          <p>JPG, PNG or WebP. Maximum 5 MB.</p>
        </div>
      </section>
      <section className="panel profile-section profile-split-section">
        <header>
          <h2>Personal information</h2>
          <p>Your details help us keep your academy account up to date.</p>
        </header>
        <form className="profile-details-form" onSubmit={saveDetails}>
          <fieldset disabled={disabled}>
            <div className="profile-account-fields">
              <label>
                Email address
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  aria-describedby="profile-email-hint"
                />
              </label>
              {user.studentNumber && (
                <label>
                  Student number
                  <input value={user.studentNumber} readOnly />
                </label>
              )}
            </div>
            <p className="profile-field-hint" id="profile-email-hint">
              Your email address
              {user.studentNumber ? " and student number cannot" : " cannot"} be
              changed.
            </p>
            <div className="profile-editable-fields">
              <label>
                Full name
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label>
                LinkedIn profile{" "}
                <span className="profile-optional">(optional)</span>
                <input
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://www.linkedin.com/in/your-name"
                />
              </label>
            </div>
            <label>
              About you <span className="profile-optional">(optional)</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="A little about your experience and interests…"
              />
            </label>
            <div className="profile-form-actions">
              <Button type="submit" disabled={disabled}>
                {busy && !photoWorking ? (
                  <LoaderCircle size={16} className="spin" />
                ) : (
                  <Save size={16} />
                )}{" "}
                {busy && !photoWorking ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </fieldset>
        </form>
      </section>
      <ChangePassword busy={disabled} />
    </div>
  );
}
