"use client";

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import PaymentHistory from "../components/PaymentHistory";
import { LoadingState } from "../components/ui";
import { authRequest } from "../lib/auth";
import {
  formatPayment,
  type CoursePrice,
  type PaymentRow,
} from "../lib/payments";
import { useServiceData } from "../lib/useAdminData";
import { useAcademy } from "../providers/AcademyProvider";

type Profile = { name: string; phone: string };
type PaymentOffer = { kind: "course"; courseId: string } | { kind: "bundle" };
type Billing = {
  courses: CoursePrice[];
  bundleAmount: number;
  mode: "test" | "live";
  checkoutEnabled: boolean;
  ownedCourseIds: string[];
  profile: Profile;
  payments: PaymentRow[];
  pending: (PaymentRow & { checkoutUrl: string | null }) | null;
};
const api = "/api/payments";

export default function PaymentsPage({ reference }: { reference?: string }) {
  const {
    data: academy,
    courseAccess,
    learningLink,
    refresh: refreshAcademy,
    user,
  } = useAcademy();
  const { data, loading, error, refresh } = useServiceData<Billing>("/", api);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<PaymentOffer>();
  const [message, setMessage] = useState("");
  const [problem, setProblem] = useState("");
  const checked = useRef("");
  const detailsForm = useRef<HTMLFormElement>(null);

  async function verify(ref: string) {
    setBusy(true);
    setProblem("");
    setMessage("Confirming payment…");
    try {
      const { payment }: { payment: PaymentRow } = await authRequest(
        "/verify",
        { reference: ref },
        "POST",
        true,
        api,
      );
      setMessage(
        payment.status === "paid"
          ? "Payment confirmed. Your learning access has been updated."
          : payment.status === "failed"
            ? "Payment wasn’t completed. You can try again."
            : "Paystack is still confirming your payment. Check again shortly.",
      );
      await Promise.all([refresh(true), refreshAcademy()]);
    } catch (e) {
      setMessage("");
      setProblem(e instanceof Error ? e.message : "Unable to check payment.");
    } finally {
      setBusy(false);
    }
  }
  const checkReturn = useEffectEvent(verify);
  useEffect(() => {
    if (
      user?.role === "student" &&
      reference &&
      checked.current !== reference
    ) {
      checked.current = reference;
      void checkReturn(reference);
    }
  }, [reference, user?.role]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setProblem("");
    try {
      await authRequest(
        "/profile",
        { name: form.get("name"), phone: form.get("phone") },
        "PUT",
        true,
        api,
      );
      setEditing(false);
      setSelectedOffer(undefined);
      if (selectedOffer) await startCheckout(selectedOffer);
      else await refresh();
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "Unable to save details.");
    } finally {
      setBusy(false);
    }
  }

  function chooseOffer(offer: PaymentOffer) {
    if (needsDetails) {
      setSelectedOffer(offer);
      detailsForm.current
        ?.querySelector<HTMLInputElement>("input:invalid, input[name=phone]")
        ?.focus();
      return;
    }
    void startCheckout(offer);
  }

  async function startCheckout(offer: PaymentOffer) {
    setBusy(true);
    setProblem("");
    setMessage("");
    try {
      const { checkoutUrl } = await authRequest(
        "/checkout",
        offer,
        "POST",
        true,
        api,
      );
      window.location.assign(checkoutUrl);
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "Unable to start checkout.");
      await refresh(true);
      setBusy(false);
    }
  }

  const next = data?.courses.find(
    ({ id }) => courseAccess[id]?.status === "payment_required",
  );
  const savings = data
    ? data.courses.reduce((sum, course) => sum + course.amount, 0) -
      data.bundleAmount
    : 0;
  const showBundle =
    data &&
    data.courses.length > 1 &&
    !data.ownedCourseIds.length &&
    savings >= 0;
  const needsDetails = editing || !data?.profile.phone;
  const canChooseOffer = Boolean(
    data?.checkoutEnabled && !busy && !data.pending,
  );
  return (
    <>
      <div className="page-title">
        <h1>Payments</h1>
        <p>
          {academy.openCourseAccess
            ? "All courses are currently open and free to study."
            : "Pay for your next course or cover the full program."}
        </p>
      </div>
      {data?.mode === "test" && data.checkoutEnabled && (
        <p className="payment-test">Test checkout · No real money is charged</p>
      )}
      {message && (
        <p className="payment-message" role="status">
          {message}
        </p>
      )}
      {(problem || error) && (
        <p className="service-error" role="alert">
          {problem || error}
        </p>
      )}
      {loading && !data && <LoadingState label="Loading payments" />}
      {data && (
        <>
          {data.pending && (
            <section className="panel payment-pending">
              <div>
                <h2>Payment pending</h2>
                <p>
                  {data.pending.title} · {formatPayment(data.pending.amount)}
                </p>
              </div>
              <div className="payment-buttons">
                {data.checkoutEnabled && data.pending.checkoutUrl && (
                  <a className="btn secondary" href={data.pending.checkoutUrl}>
                    Resume checkout
                  </a>
                )}
                <button
                  className="btn"
                  type="button"
                  disabled={busy || !data.pending.checkoutUrl}
                  onClick={() => verify(data.pending!.reference)}
                >
                  Check payment
                </button>
              </div>
            </section>
          )}
          {!data.pending && next ? (
            <>
              <section className="panel payment-details">
                <h2>Your learner details</h2>
                {needsDetails ? (
                  <>
                    <p role="status">
                      {selectedOffer
                        ? `Save your details to continue to Paystack for ${selectedOffer.kind === "bundle" ? "the full program" : next.title}.`
                        : "Save your name and phone number before paying."}
                    </p>
                    <form
                      ref={detailsForm}
                      className="payment-fields"
                      onSubmit={saveProfile}
                    >
                      <label>
                        Full name
                        <input
                          name="name"
                          autoComplete="name"
                          required
                          minLength={2}
                          maxLength={120}
                          defaultValue={data.profile.name}
                        />
                      </label>
                      <label>
                        Phone number
                        <input
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          required
                          placeholder="+234…"
                          defaultValue={data.profile.phone}
                        />
                      </label>
                      <button className="btn secondary" disabled={busy}>
                        {selectedOffer
                          ? "Save and continue to Paystack"
                          : "Save details"}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="payment-details-saved">
                    <p>
                      {data.profile.name} · {data.profile.phone}
                    </p>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => setEditing(true)}
                    >
                      Edit details
                    </button>
                  </div>
                )}
              </section>
              <div className="payment-offers">
                <section className="panel payment-offer">
                  <span className="eyebrow red">PAY PER COURSE</span>
                  <h2>{next.title}</h2>
                  <strong>{formatPayment(next.amount)}</strong>
                  <p>
                    Unlock this course and pay for the next one when you’re
                    ready.
                  </p>
                  <button
                    className="btn secondary"
                    disabled={!canChooseOffer}
                    onClick={() =>
                      chooseOffer({ kind: "course", courseId: next.id })
                    }
                  >
                    {needsDetails
                      ? "Select this course"
                      : "Pay for this course"}{" "}
                    <ArrowRight size={16} />
                  </button>
                </section>
                {showBundle && (
                  <section className="panel payment-offer payment-bundle">
                    <span className="eyebrow red">FULL PROGRAM</span>
                    <h2>All {data.courses.length} courses</h2>
                    <strong>{formatPayment(data.bundleAmount)}</strong>
                    <p>
                      {savings > 0 && <b>Save {formatPayment(savings)}. </b>}
                      Each course opens as you complete the one before it.
                    </p>
                    <button
                      className="btn"
                      disabled={!canChooseOffer}
                      onClick={() => chooseOffer({ kind: "bundle" })}
                    >
                      {needsDetails
                        ? "Select full program"
                        : "Pay for all courses"}{" "}
                      <ArrowRight size={16} />
                    </button>
                  </section>
                )}
              </div>
            </>
          ) : (
            !data.pending && (
              <section className="panel payment-pending">
                <div>
                  <h2>
                    {data.courses.length > 0 &&
                    data.courses.every(({ id }) =>
                      data.ownedCourseIds.includes(id),
                    )
                      ? "Your courses are covered"
                      : "No payment due now"}
                  </h2>
                  <p>Follow your learning path to see what comes next.</p>
                </div>
                <Link
                  href={
                    learningLink === "/payments" ? "/my-courses" : learningLink
                  }
                  className="btn secondary"
                >
                  Go to my learning <CheckCircle2 size={16} />
                </Link>
              </section>
            )
          )}
          {next && !data.checkoutEnabled && (
            <p role="status">Checkout is temporarily unavailable.</p>
          )}
          <PaymentHistory payments={data.payments} />
        </>
      )}
    </>
  );
}
