"use client";
import Verify from "../components/Verify";

import { useAcademy } from "../providers/AcademyProvider";

export default function VerifyPage() {
  const { path } = useAcademy();
  return <Verify id={path.split("/")[2]} />;
}
