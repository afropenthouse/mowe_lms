"use client";
import Profile from "../components/Profile";
import { LoadingState } from "../components/ui";

import { useAcademy } from "../providers/AcademyProvider";

export default function ProfilePage() {
  const { busy, user, action, upload, signOut } = useAcademy();
  if (!user) return <LoadingState label="Loading your profile" />;
  return (
    <Profile
      key={user.id}
      user={user}
      action={action}
      busy={busy}
      upload={upload}
      signOut={signOut}
    />
  );
}
