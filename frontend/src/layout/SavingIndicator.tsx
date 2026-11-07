"use client";
import { LoaderCircle } from "lucide-react";
import { useAcademy } from "../providers/AcademyProvider";

export default function SavingIndicator() {
  const { busy } = useAcademy();
  return (
    <>
      {busy && (
        <div className="saving-indicator">
          <LoaderCircle size={16} className="spin" />
          Saving…
        </div>
      )}
    </>
  );
}
