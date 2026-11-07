import { BookOpen, type LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import Spinner from "./Spinner";
export function Button({
  children,
  onClick,
  secondary = false,
  disabled = false,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean }) {
  return (
    <button
      className={`btn ${secondary ? "secondary" : ""}`}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Empty({
  icon: Icon = BookOpen,
  title,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <Icon size={38} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export function RichText({ text }: { text: string }) {
  return (
    <div className="prose">
      {text
        .split("\n\n")
        .map((p, i) =>
          p.startsWith("## ") ? (
            <h2 key={i}>{p.slice(3)}</h2>
          ) : p.startsWith("# ") ? (
            <h2 key={i}>{p.slice(2)}</h2>
          ) : (
            <p key={i}>
              {p
                .split(/(\*\*[^*]+\*\*)/g)
                .map((s, n) =>
                  s.startsWith("**") ? (
                    <strong key={n}>{s.slice(2, -2)}</strong>
                  ) : (
                    s
                  ),
                )}
            </p>
          ),
        )}
    </div>
  );
}

export function Stat({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: ReactNode;
  icon: LucideIcon;
}) {
  return (
    <div className="stat">
      <span>
        {title}
        <Icon size={19} />
      </span>
      <strong>{value}</strong>
      <small>Your CBA journey</small>
    </div>
  );
}

export function LoadingState({
  label = "Loading your learning space",
}: {
  label?: string;
}) {
  return (
    <div className="loading-state" role="status" aria-label={label}>
      <Spinner />
    </div>
  );
}
