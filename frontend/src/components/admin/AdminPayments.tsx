"use client";

import { useState, type FormEvent } from "react";
import PaymentHistory from "../PaymentHistory";
import { LoadingState } from "../ui";
import { authRequest } from "../../lib/auth";
import { useAdminData } from "../../lib/useAdminData";
import {
  formatPayment,
  type CoursePrice,
  type PaymentRow,
} from "../../lib/payments";

type PaymentRegister = {
  courses: CoursePrice[];
  bundleAmount: number;
  payments: PaymentRow[];
  total: number;
  pageSize: number;
};

export default function AdminPayments() {
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [problem, setProblem] = useState("");
  const { data, loading, error, refresh } = useAdminData<PaymentRegister>(
    `/payments?page=${page}`,
  );

  async function savePricing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) return;
    const values = new FormData(event.currentTarget);
    const minorUnits = (key: string) =>
      Math.round(Number(values.get(key)) * 100);
    setBusy(true);
    setMessage("");
    setProblem("");
    try {
      await authRequest(
        "/payments/pricing",
        {
          bundleAmount: minorUnits("bundle"),
          courseAmounts: Object.fromEntries(
            data.courses.map(({ id }) => [id, minorUnits(`course:${id}`)]),
          ),
        },
        "PUT",
        true,
        "/api/admin",
      );
      setMessage("Prices saved for new checkouts.");
      await refresh();
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "Unable to save pricing.");
    } finally {
      setBusy(false);
    }
  }

  const savings = data
    ? data.courses.reduce((sum, item) => sum + item.amount, 0) -
      data.bundleAmount
    : 0;
  return (
    <>
      <div className="page-title">
        <h1>Payments</h1>
        <p>Manage prices and review learner purchases.</p>
      </div>
      {message && (
        <p className="payment-message" role="status">
          {message}
        </p>
      )}
      {(error || problem) && (
        <p className="service-error" role="alert">
          {problem || error}
        </p>
      )}
      {loading && !data && <LoadingState label="Loading payments" />}
      {data && (
        <>
          <section className="panel payment-details">
            <h2>Pricing</h2>
            {data.courses.length > 1 && savings > 0 && (
              <p>Current bundle saving: {formatPayment(savings)}</p>
            )}
            <form className="payment-fields" onSubmit={savePricing}>
              {data.courses.map(({ id, title, amount }) => (
                <label key={`${id}:${amount}`}>
                  {title} (₦)
                  <input
                    name={`course:${id}`}
                    type="number"
                    min="100"
                    max="1000000"
                    step="0.01"
                    required
                    defaultValue={amount / 100}
                  />
                </label>
              ))}
              <label key={data.bundleAmount}>
                Full program (₦)
                <input
                  name="bundle"
                  type="number"
                  min="100"
                  max="1000000"
                  step="0.01"
                  required
                  defaultValue={data.bundleAmount / 100}
                />
              </label>
              <button className="btn" disabled={busy}>
                Save prices
              </button>
            </form>
          </section>
          <PaymentHistory admin payments={data.payments} />
          {data.total > data.pageSize && (
            <div className="payment-buttons payment-pagination">
              <button
                type="button"
                className="btn secondary"
                disabled={page === 1 || loading}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} of {Math.ceil(data.total / data.pageSize)}
              </span>
              <button
                type="button"
                className="btn secondary"
                disabled={page * data.pageSize >= data.total || loading}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
