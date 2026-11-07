"use client";
import { X } from "lucide-react";
import { useAcademy } from "../providers/AcademyProvider";

export default function Toast() {
  const { toast, setToast } = useAcademy();
  return (
    <>
      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
}
