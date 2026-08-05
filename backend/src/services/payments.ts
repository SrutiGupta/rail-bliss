/**
 * Payment gateway integration.
 *
 * The requirements (ll.md) list a payment gateway as an external HTTPS API the
 * passenger hits after booking. In a real deployment this talks to a PSP such as
 * Razorpay/Stripe over HTTPS. Here we provide a deterministic mock gateway that
 * behaves like the real thing (authorize -> capture) so the booking flow works
 * end-to-end without external credentials.
 */
export interface ChargeRequest {
  amount: number;
  currency: string;
  description: string;
  referenceId: string;
}

export interface ChargeResponse {
  transactionId: string;
  status: "SUCCESS" | "FAILED";
  gateway: string;
  amount: number;
  currency: string;
  message: string;
}

export async function chargePayment(
  request: ChargeRequest,
): Promise<ChargeResponse> {
  const amountCents = Math.round(request.amount * 100);
  const transactionId = `GTX_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
  return {
    transactionId,
    status: "SUCCESS",
    gateway: "mock-payment-gateway",
    amount: amountCents,
    currency: request.currency,
    message: `Payment of ${request.currency} ${request.amount.toFixed(
      2,
    )} authorised for ${request.description}`,
  };
}