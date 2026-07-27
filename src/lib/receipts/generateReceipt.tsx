// faaaaaa!
import { renderToBuffer } from "@react-pdf/renderer";
import { ReceiptDocument } from "./ReceiptDocument";

export async function generateAndUploadReceipt(order: any) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

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

  const deliveryFee = order.customer?.delivery_fee_cents || 0;

  const buffer = await renderToBuffer(
    <ReceiptDocument
      orderId={order.order_id}
      createdAt={order.created_at || new Date().toISOString()}
      customerName={order.customer?.name || "Customer"}
      items={items}
      subtotalCents={subtotal}
      deliveryFeeCents={deliveryFee}
      totalCents={order.total_cents}
      logoUrl="https://a01luxe.vercel.app/a01luxe-receipt-logo.png"
    />
  );

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);

  const fileName = `${order.order_id}-${timestamp}.pdf`;

   // Upload the file
  const { error: uploadError } = await supabaseAdmin.storage
    .from("media")
    .upload(`receipts/${fileName}`, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload failed:", uploadError);
    throw new Error("Failed to upload receipt: " + uploadError.message);
  }

  // Create a signed URL that expires in 30 days
  const { data: signed, error: signError } = await supabaseAdmin.storage
    .from("media")
    .createSignedUrl(`receipts/${fileName}`, 60 * 60 * 24 * 30); // 30 days

  if (signError || !signed?.signedUrl) {
    console.error("Signed URL failed:", signError);
    throw new Error("Failed to create signed URL");
  }

  return signed.signedUrl;
}
