export type CoursePrice = { id: string; title: string; amount: number };

export type PaymentRow = {
  reference: string;
  title: string;
  amount: number;
  status: "pending" | "paid" | "failed";
  mode: "test" | "live";
  createdAt: string;
  paidAt: string | null;
  learner?: { name: string; email: string };
};

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
});
export const formatPayment = (amount: number) => naira.format(amount / 100);
