import { useState } from "react";
import { toast } from "sonner";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

type Props = {
  orderId: string;
  amount: number; // in Naira (e.g. 108000)
  email: string;
  customerName: string;
  onSuccess?: (reference: string) => void;
};

export function PaystackButton({
  orderId,
  amount,
  email,
  customerName,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);

  const payWithPaystack = () => {
    setLoading(true);

    const handler = window.PaystackPop.setup({
      key: "pk_test_a237a23a24c0339bf69dc33dfc020d219bcba0cf", // ← your Test Public Key
      email: email,
      amount: amount * 100, // Paystack expects kobo
      currency: "NGN",
      ref: `${orderId}-${Date.now()}`,
      metadata: {
        order_id: orderId,
        customer_name: customerName,
      },
      callback: function (response: any) {
        setLoading(false);
        toast.success("Payment successful!");
        if (onSuccess) onSuccess(response.reference);
      },
      onClose: function () {
        setLoading(false);
        toast.message("Payment window closed");
      },
    });

    handler.openIframe();
  };

  return (
    <button
      onClick={payWithPaystack}
      disabled={loading}
      className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider py-4 rounded-none hover:opacity-90 transition disabled:opacity-50"
    >
      {loading ? "Processing..." : `Pay ₦${amount.toLocaleString()} with Paystack`}
    </button>
  );
}
