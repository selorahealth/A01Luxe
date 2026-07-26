import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@supabase/supabase-js";
import { ReceiptDocument } from "./ReceiptDocument";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // use service role for upload
);

export async function generateAndUploadReceipt(order: any) {
  // 1. Prepare data
  const items = (order.items || []).map((i: any) => ({
    name: i.name,
    qty: i.qty,
    price_cents: i.price_cents,
    size: i.size,
    color: i.color,
  }));

  const subtotal = items.reduce(
    (sum: number, i: any) => sum + i.price_cents * i.qty,
    0
  );

  const deliveryFee =
    order.customer?.delivery_fee_cents || 0;

  // 2. Generate PDF buffer
  const buffer = await renderToBuffer(
    <ReceiptDocument
      orderId={order.order_id}
      createdAt={order.created_at || new Date().toISOString()}
      customerName={order.customer?.name || "Customer"}
      items={items}
      subtotalCents={subtotal}
      deliveryFeeCents={deliveryFee}
      totalCents={order.total_cents}
      logoUrl: "https://a01luxe.vercel.app/a01luxe-receipt-logo.png" // ← put your logo public URL here
    />
  );

  // 3. Filename: orderID-timestamp.pdf
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19); // 2026-07-26T23-45-12

  const fileName = `${order.order_id}-${timestamp}.pdf`;

  // 4. Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("receipts") // create this bucket if it doesn't exist
    .upload(fileName, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload failed:", uploadError);
    throw new Error("Failed to upload receipt");
  }

  // 5. Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("receipts").getPublicUrl(fileName);

  return publicUrl;
}
