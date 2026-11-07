"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { authRequest, AuthError, safeDestination } from "../../lib/auth";
import { useAcademy } from "../../providers/AcademyProvider";
import Spinner from "../Spinner";
import ThemeToggle from "../ThemeToggle";
type Mode =
  "login" | "signup" | "verify-email" | "forgot-password" | "reset-password";
const copy = {
  login: {
    tag: "WELCOME BACK",
    title: "Your next chapter continues.",
    description: "Sign in to pick up where you left off.",
  },
  signup: {
    tag: "YOUR AMBITION BELONGS HERE",
    title: "Your next chapter starts here.",
    description: "Create your account and start building your business skills.",
  },
  "verify-email": {
    tag: "ONE SMALL STEP TO GET STARTED",
    title: "Check your inbox.",
    description: "Enter the six-digit code we sent to your email.",
  },
  "forgot-password": {
    tag: "LET’S GET YOU BACK IN",
    title: "A fresh start, in a few steps.",
    description:
      "We’ll send a verification code to help you reset your password.",
  },
  "reset-password": {
    tag: "SECURE YOUR NEXT CHAPTER",
    title: "Set a new password.",
    description: "Enter your email code and choose a strong new password.",
  },
};
export default function AuthScreen({
  mode,
  portal = "learner",
}: {
  mode: Mode;
  portal?: "learner" | "admin";
}) {
  const router = useRouter(),
    params = useSearchParams();
  const { refresh } = useAcademy();
  const [email, setEmail] = useState(params.get("email") || ""),
    [name, setName] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [code, setCode] = useState(""),
    [remember, setRemember] = useState(false),
    [show, setShow] = useState(false),
    [showConfirm, setShowConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [success, setSuccess] = useState(false),
    [cooldown, setCooldown] = useState(60);
  const challenge = params.get("challenge") || "";
  const invite = params.get("invite") || "";
  const role = portal === "admin" ? "admin" : "student";
  const base = portal === "admin" ? "/admin" : "";
  const text =
    portal === "admin" && mode === "signup"
      ? {
          tag: "YOUR PRIVATE INVITATION",
          title: "Welcome to your academy.",
          description:
            "Create your account to manage courses and support your learners.",
        }
      : portal === "admin" && mode === "login"
        ? {
            tag: "ACADEMY MANAGEMENT",
            title: "Administrator sign in.",
            description: "Sign in to manage your academy.",
          }
        : copy[mode];
  const next = params.get("next");
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  function challengePath(path: string, id: string) {
    return `${base}/${path}?${new URLSearchParams({ challenge: id, email, ...(next ? { next } : {}) })}`;
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (
      (mode === "signup" || mode === "reset-password") &&
      password !== confirm
    ) {
      setError("Your passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const result = await authRequest("/register", {
          name,
          email,
          password,
          role,
          ...(role === "admin" ? { inviteToken: invite } : {}),
        });
        router.push(challengePath("verify-email", result.challengeId));
      } else if (mode === "login") {
        const result = await authRequest("/login", {
          email,
          password,
          remember,
          portal,
        });
        await refresh();
        router.replace(safeDestination(next, result.user.role));
        router.refresh();
      } else if (mode === "verify-email") {
        const result = await authRequest("/verify-email", {
          challengeId: challenge,
          code,
          portal,
        });
        await refresh();
        router.replace(safeDestination(next, result.user.role));
        router.refresh();
      } else if (mode === "forgot-password") {
        const result = await authRequest("/forgot-password", { email });
        router.push(challengePath("reset-password", result.challengeId));
      } else {
        await authRequest("/reset-password", {
          challengeId: challenge,
          code,
          password,
        });
        await refresh();
        setSuccess(true);
      }
    } catch (e) {
      if (
        e instanceof AuthError &&
        e.code === "EMAIL_UNVERIFIED" &&
        e.challengeId
      ) {
        router.push(challengePath("verify-email", e.challengeId));
        return;
      }
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    setError("");
    setBusy(true);
    try {
      const result = await authRequest("/resend-code", {
        challengeId: challenge,
      });
      setNotice(result.message);
      setCooldown(60);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to resend the code.");
    } finally {
      setBusy(false);
    }
  }
  const needsCode = mode === "verify-email" || mode === "reset-password";
  return (
    <div
      className={`auth-layout auth-layout--${mode}${portal === "admin" ? " auth-layout--admin" : ""}`}
    >
      <aside className="auth-story">
        {portal !== "admin" && (
          <Image
            src="/student-learning.jpg"
            alt="A student taking notes in a bright learning space"
            fill
            sizes="(max-width: 900px) 0px, 45vw"
            className="auth-story-photo"
            priority
          />
        )}
        <div className="auth-story-shade" />
        <Link href="/" className="auth-story-brand">
          {portal === "admin" ? (
            <ShieldCheck size={30} />
          ) : (
            <GraduationCap size={30} />
          )}
          <span>
            MOWE <b>ACADEMY</b>
          </span>
        </Link>
        <div className="auth-story-copy">
          <span className="eyebrow">
            {portal === "admin"
              ? "MOWE ACADEMY · ADMINISTRATION"
              : "POTENTIAL, PUT INTO PRACTICE."}
          </span>
          <h2>
            {portal === "admin" ? (
              <>
                Shape the learning.
                <br />
                Support the ambition.
                <br />
                <em>Lead your academy.</em>
              </>
            ) : (
              <>
                Big ambition.
                <br />
                Real capability.
                <br />
                <em>Your next chapter.</em>
              </>
            )}
          </h2>
          <p>
            {portal === "admin"
              ? "Your private workspace to manage courses, support learners, and keep the academy moving forward."
              : "Build the business skills to move forward with confidence."}
          </p>
          <div className="auth-story-proof">
            <span>
              <Check size={16} />
              {portal === "admin" ? "Course management" : "Focused courses"}
            </span>
            <span>
              <Check size={16} />
              {portal === "admin"
                ? "Learner support"
                : "Practical business skills"}
            </span>
            <span>
              <Check size={16} />
              {portal === "admin"
                ? "Private administrator access"
                : "Your pace. Your progress."}
            </span>
          </div>
        </div>
        <small>
          {portal === "admin"
            ? "ACADEMY MANAGEMENT PORTAL"
            : "THE CERTIFIED BUSINESS ADMINISTRATOR PROGRAM"}
        </small>
      </aside>
      <section className="auth-panel">
        <div className="auth-top">
          <Link href="/">
            <ArrowLeft size={15} />
            Back to academy
          </Link>
          <div className="auth-top-actions">
            <span>
              <ShieldCheck size={15} />
              {portal === "admin" ? "Administrator access" : "Secure account"}
            </span>
            <ThemeToggle />
          </div>
        </div>
        <div className="auth-form-wrap">
          <Link href="/" className="brand auth-mobile-brand">
            <Image
              src="/mowe-logo.png"
              width={150}
              height={54}
              alt="MOWE Global"
            />
          </Link>
          {portal === "admin" && (
            <div className="auth-admin-badge">
              <ShieldCheck size={14} /> ADMIN PORTAL
            </div>
          )}
          {success ? (
            <div className="auth-success">
              <span className="auth-icon">
                <CheckCircle2 size={28} />
              </span>
              <div className="eyebrow red">A FRESH START</div>
              <h1>Your password is updated.</h1>
              <p>
                Sign in with your new password. For your security, you’ve been
                signed out on all devices.
              </p>
              <Link href={`${base}/login`} className="btn">
                Back to sign in <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <>
              <span className="auth-icon">
                {needsCode ? (
                  <Mail size={25} />
                ) : mode === "forgot-password" ? (
                  <KeyRound size={25} />
                ) : (
                  <GraduationCap size={26} />
                )}
              </span>
              <div className="eyebrow red">{text.tag}</div>
              <h1>{text.title}</h1>
              <p className="auth-description">{text.description}</p>
              {needsCode && email && (
                <div className="auth-email">
                  <Mail size={15} />
                  {email}
                </div>
              )}
              {needsCode && !challenge ? (
                <div className="auth-message">
                  <p>
                    Start with your email address to receive a new verification
                    code.
                  </p>
                  <Link
                    className="text-link"
                    href={
                      mode === "reset-password"
                        ? `${base}/forgot-password`
                        : `${base}/login`
                    }
                  >
                    Get started <ArrowRight size={16} />
                  </Link>
                </div>
              ) : (
                <form
                  onSubmit={submit}
                  className={`auth-form ${mode === "signup" ? "auth-form-signup" : ""}`}
                >
                  {mode === "signup" && (
                    <label>
                      Full name
                      <div className="auth-input">
                        <UserRound size={18} />
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          autoComplete="name"
                          placeholder="Your full name"
                          minLength={2}
                          maxLength={100}
                          required
                        />
                      </div>
                    </label>
                  )}
                  {["login", "signup", "forgot-password"].includes(mode) && (
                    <label>
                      Email address
                      <div className="auth-input">
                        <Mail size={18} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="email"
                          placeholder="you@example.com"
                          maxLength={254}
                          required
                        />
                      </div>
                    </label>
                  )}
                  {needsCode && (
                    <label>
                      Verification code
                      <input
                        className="auth-code"
                        value={code}
                        onChange={(e) =>
                          setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        placeholder="000000"
                        required
                      />
                      <small className="auth-hint">
                        Six digits. Valid for 10 minutes. Up to 5 attempts.
                      </small>
                    </label>
                  )}
                  {["login", "signup", "reset-password"].includes(mode) && (
                    <label className="auth-password-field">
                      {mode === "reset-password" ? "New password" : "Password"}
                      <div className="auth-input">
                        <LockKeyhole size={18} />
                        <input
                          type={show ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete={
                            mode === "login"
                              ? "current-password"
                              : "new-password"
                          }
                          placeholder={
                            mode === "login"
                              ? "Enter your password"
                              : "Create a strong password"
                          }
                          minLength={mode === "login" ? 1 : 8}
                          maxLength={mode === "login" ? 128 : 12}
                          required
                        />
                        <button
                          className="auth-password-toggle"
                          type="button"
                          aria-label={show ? "Hide password" : "Show password"}
                          onClick={() => setShow(!show)}
                        >
                          {show ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {mode !== "login" && (
                        <small className="auth-hint">
                          Use 8–12 characters for your password.
                        </small>
                      )}
                    </label>
                  )}
                  {["signup", "reset-password"].includes(mode) && (
                    <label className="auth-confirm-field">
                      Confirm password
                      <div className="auth-input">
                        <LockKeyhole size={18} />
                        <input
                          type={showConfirm ? "text" : "password"}
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          autoComplete="new-password"
                          placeholder="Enter your password again"
                          minLength={8}
                          maxLength={12}
                          required
                        />
                        <button
                          className="auth-password-toggle"
                          type="button"
                          aria-label={
                            showConfirm
                              ? "Hide confirmation password"
                              : "Show confirmation password"
                          }
                          onClick={() => setShowConfirm(!showConfirm)}
                        >
                          {showConfirm ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </label>
                  )}
                  {mode === "login" && (
                    <div className="auth-form-options">
                      <label>
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                        />
                        Remember me
                      </label>
                      <Link href={`${base}/forgot-password`}>
                        Forgot password?
                      </Link>
                    </div>
                  )}
                  {error && (
                    <div className="auth-error" role="alert">
                      {error}
                    </div>
                  )}
                  {notice && (
                    <div className="auth-notice" role="status">
                      {notice}
                    </div>
                  )}
                  <button
                    className="btn auth-submit"
                    type="submit"
                    disabled={busy}
                    aria-busy={busy}
                    aria-label={busy ? "Processing your request" : undefined}
                  >
                    {busy ? (
                      <Spinner small />
                    ) : (
                      <>
                        {
                          {
                            login: "Sign in",
                            signup: "Create account",
                            "verify-email": "Verify & continue",
                            "forgot-password": "Send reset code",
                            "reset-password": "Update password",
                          }[mode]
                        }
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                  {needsCode && (
                    <div className="auth-resend">
                      Didn’t receive your code?{" "}
                      <button
                        type="button"
                        disabled={busy || cooldown > 0}
                        onClick={resend}
                      >
                        {cooldown > 0
                          ? `Resend in ${cooldown}s`
                          : "Resend code"}
                      </button>
                      <small>Check your spam or promotions folder too.</small>
                    </div>
                  )}
                </form>
              )}
              <div className="auth-bottom">
                {mode === "login" ? (
                  <>
                    {portal === "admin" ? (
                      <span>
                        Use the account linked to your academy invitation.
                      </span>
                    ) : (
                      <>
                        New to MOWE Academy?{" "}
                        <Link href="/signup">Create an account</Link>
                      </>
                    )}
                  </>
                ) : mode === "signup" ? (
                  <>
                    Already have an account?{" "}
                    <Link href={`${base}/login`}>Sign in</Link>
                  </>
                ) : (
                  <Link href={`${base}/login`}>
                    <ArrowLeft size={14} />
                    Back to sign in
                  </Link>
                )}
              </div>
              <div className="auth-security">
                <ShieldCheck size={15} />
                <span>Your account. Your progress. Securely connected.</span>
              </div>
            </>
          )}
        </div>
        <div className="auth-copyright">
          © {new Date().getFullYear()} MOWE Global · Built for your next
          chapter.
        </div>
      </section>
    </div>
  );
}
