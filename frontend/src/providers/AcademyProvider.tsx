"use client";
import {
  Award,
  BadgeCheck,
  Bookmark,
  BookOpen,
  CheckCheck,
  FileText,
  LayoutDashboard,
  Library,
  Megaphone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { courseImages } from "../lib/courseImages";
import { lessons } from "../lib/curriculum";
import type { Course } from "../lib/types";
import { authRequest, learningRequest } from "../lib/auth";
const signin = (path = "/dashboard") =>
  `/signup?next=${encodeURIComponent(path)}`;
function useAcademyState() {
  const path = usePathname();
  const router = useRouter();
  const [data, setData] = useState<any>({
      courses: [],
      progress: [],
      attempts: [],
      submissions: [],
      discussion: [],
      certificates: [],
      admin: {
        students: [],
        progress: [],
        attempts: [],
        submissions: [],
        media: [],
        versions: [],
      },
      settings: { price: 0, currency: "NGN", enrollmentOpen: true },
    }),
    [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false),
    [mobile, setMobile] = useState(false),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [saved, setSaved] = useState<string[]>([]),
    [sampleCertificate, setSampleCertificate] = useState(false);
  const revisionRef = useRef("");
  const requestSerial = useRef(0);
  const busyRef = useRef(false);
  const checkingUpdates = useRef(false);
  const bookmarkRequests = useRef(new Set<string>());
  const courses: Course[] = useMemo(
    () =>
      (data.courses || []).filter(
        (c: Course) => path.startsWith("/admin") || c.status === "published",
      ),
    [data.courses, path],
  );
  const user = data.user;
  const allLessons = useMemo(() => courses.flatMap(lessons), [courses]);
  const completed = useMemo(
    () =>
      new Set<string>(
        (data.progress || [])
          .filter(
            (p: any) =>
              p.completed && allLessons.some((l) => l.id === p.lesson_id),
          )
          .map((p: any) => String(p.lesson_id)),
      ),
    [data.progress, allLessons],
  );
  const percent = allLessons.length
    ? Math.round((completed.size / allLessons.length) * 100)
    : 0;
  function go(destination: string) {
    setMobile(false);
    setQuery("");
    router.push(destination);
  }
  const refresh = useCallback(async () => {
    const serial = ++requestSerial.current;
    setRefreshing(true);
    try {
      const [session, d] = await Promise.all([
        authRequest("/me"),
        learningRequest("/state"),
      ]);
      d.user = session.user;
      if (serial !== requestSerial.current) return d;
      revisionRef.current = d.revision || "";
      try {
        setSaved(
          session.user
            ? d.saved || []
            : JSON.parse(
                localStorage.getItem(
                  "mowe-bookmarks:" + (session.user?.id || "public"),
                ) || "[]",
              ),
        );
      } catch {
        setSaved([]);
      }
      setData(d);
      setError("");
      return d;
    } catch (e: any) {
      if (serial === requestSerial.current) setError(e.message);
    } finally {
      if (serial === requestSerial.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);
  const checkUpdates = useCallback(async () => {
    if (
      document.hidden ||
      busyRef.current ||
      checkingUpdates.current ||
      !revisionRef.current
    )
      return;
    checkingUpdates.current = true;
    try {
      const result = await learningRequest("/updates");
      if (result.revision !== revisionRef.current) await refresh();
    } catch {
    } finally {
      checkingUpdates.current = false;
    }
  }, [refresh]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => {
    checkUpdates();
    const timer = setInterval(checkUpdates, 15000);
    window.addEventListener("focus", checkUpdates);
    document.addEventListener("visibilitychange", checkUpdates);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", checkUpdates);
      document.removeEventListener("visibilitychange", checkUpdates);
    };
  }, [path, checkUpdates]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  async function action(
    action: string,
    payload: any = {},
    message = "Saved successfully",
  ) {
    setBusy(true);
    busyRef.current = true;
    try {
      if (!user) {
        router.push("/login");
        return null;
      }
      const result =
        action === "profile"
          ? await authRequest("/profile", payload, "PATCH")
          : await learningRequest("/actions", { action, payload });
      await refresh();
      if (message) setToast(message);
      return result;
    } catch (e: any) {
      setToast(e.message);
      return null;
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }
  async function upload(
    file: File,
    purpose: string,
    courseId?: string,
  ): Promise<any> {
    const max = purpose === "photo" ? 5 : 20;
    if (!file.size || file.size > max * 1024 * 1024) {
      setToast(`Choose a non-empty file smaller than ${max} MB.`);
      return null;
    }
    const body = new FormData();
    body.append("file", file);
    body.append("purpose", purpose);
    if (courseId) body.append("courseId", courseId);
    setBusy(true);
    busyRef.current = true;
    try {
      const result = await authRequest("", body, "POST", true, "/api/files");
      await refresh();
      setToast("File uploaded");
      return result;
    } catch (e: any) {
      setToast(e.message);
      return null;
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  }
  function enroll() {
    if (!user) {
      location.href = signin("/dashboard");
      return;
    }
    action("enroll", {}, "You’re enrolled. Welcome to your next chapter.").then(
      (r) => r && go("/dashboard"),
    );
  }
  async function toggleSaved(id: string) {
    if (bookmarkRequests.current.has(id)) return;
    const next = saved.includes(id)
      ? saved.filter((x) => x !== id)
      : [...saved, id];
    setSaved(next);
    if (user) {
      bookmarkRequests.current.add(id);
      const result = await action(
        "bookmark",
        { courseId: id, saved: next.includes(id) },
        next.includes(id) ? "Course saved" : "Course removed from saved",
      );
      if (!result) setSaved(saved);
      bookmarkRequests.current.delete(id);
    } else
      localStorage.setItem(
        "mowe-bookmarks:" + (user?.id || "public"),
        JSON.stringify(next),
      );
  }
  const authPage = [
    "/login",
    "/signup",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
  ].includes(path.replace(/^\/admin(?=\/)/, ""));
  const app =
    !authPage &&
    path !== "/" &&
    !path.startsWith("/verify") &&
    !path.startsWith("/course/");
  const admin = path.startsWith("/admin");
  const courseId = path.split("/")[2];
  const course = courses.find((c) => c.id === courseId);
  const nextLesson = allLessons.find((l) => !completed.has(l.id));
  const nextCourse = courses.find((c) =>
    lessons(c).some((l) => l.id === nextLesson?.id),
  );
  const nextCourseImage = nextCourse ? courseImages[nextCourse.id] : undefined;
  const learningLink =
    nextCourse && nextLesson
      ? `/learn/${nextCourse.id}/${nextLesson.id}`
      : "/courses";
  const nav = [
    ["/dashboard", "Overview", LayoutDashboard],
    ["/courses", "My courses", BookOpen],
    ["/certificates", "Certificates", Award],
    ["/saved", "Saved courses", Bookmark],
    ["/profile", "My profile", Users],
  ] as const;
  const navAdmin = [
    ["/admin", "Overview", LayoutDashboard],
    ["/admin/courses", "Content library", Library],
    ["/admin/students", "Learners", Users],
    ["/admin/team", "Administrators", ShieldCheck],
    ["/admin/review", "Assessments", CheckCheck],
    ["/admin/media", "Media library", FileText],
    ["/admin/announcements", "Announcements", Megaphone],
    ["/admin/certificates", "Certificates", Award],
    ["/admin/certificate-demo", "Certificate preview", BadgeCheck],
    ["/admin/profile", "My profile", Users],
  ] as const;
  return {
    authPage,
    signOut: async () => {
      const destination = user?.role === "admin" ? "/admin/login" : "/login";
      await authRequest("/logout", {});
      await refresh();
      router.replace(destination);
      router.refresh();
    },
    data,
    setData,
    loading,
    setLoading,
    error,
    setError,
    toast,
    setToast,
    busy,
    setBusy,
    mobile,
    setMobile,
    query,
    setQuery,
    filter,
    setFilter,
    saved,
    setSaved,
    sampleCertificate,
    setSampleCertificate,
    courses,
    user,
    allLessons,
    completed,
    percent,
    go,
    refresh,
    refreshing,
    action,
    upload,
    enroll,
    toggleSaved,
    app,
    admin,
    courseId,
    course,
    nextLesson,
    nextCourse,
    nextCourseImage,
    learningLink,
    nav,
    navAdmin,
    path,
  };
}
const AcademyContext = createContext<ReturnType<typeof useAcademyState> | null>(
  null,
);
export function AcademyProvider({ children }: { children: ReactNode }) {
  const value = useAcademyState();
  return (
    <AcademyContext.Provider value={value}>{children}</AcademyContext.Provider>
  );
}
export function useAcademy() {
  const context = useContext(AcademyContext);
  if (!context) throw Error("AcademyProvider is required");
  return context;
}
