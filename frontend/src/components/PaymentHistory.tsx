import { formatPayment, type PaymentRow } from "../lib/payments";

export default function PaymentHistory({
  payments,
  admin = false,
}: {
  payments: PaymentRow[];
  admin?: boolean;
}) {
  return (
    <section className="panel payment-history">
      <h2>Payment history</h2>
      {payments.length ? (
        <div className="payment-table-scroll">
          <table>
            <thead>
              <tr>
                {admin && <th scope="col">Learner</th>}
                <th scope="col">Purchase</th>
                <th scope="col">Amount</th>
                <th scope="col">Status</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.reference}>
                  {admin && (
                    <td>
                      {payment.learner?.name}
                      <small>{payment.learner?.email}</small>
                    </td>
                  )}
                  <td>{payment.title}</td>
                  <td>{formatPayment(payment.amount)}</td>
                  <td>
                    <span className={`payment-status is-${payment.status}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td>{(payment.paidAt ?? payment.createdAt).slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No payments yet.</p>
      )}
    </section>
  );
}
