export default function Spinner({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`loading-spinner${small ? " loading-spinner--small" : ""}`}
      aria-hidden="true"
    />
  );
}
