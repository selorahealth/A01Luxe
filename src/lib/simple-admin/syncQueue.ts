// Client-side sync engine for the offline product queue.
// Runs only when the device is back online; uploads images first, then creates
// the product through the permission-checked server function.

import { padImages, slugify } from "@/lib/format";
import { uploadMedia } from "@/lib/upload";
import { createSyncedProduct } from "@/lib/simple-admin/simple-sync.functions";
import { parseProductFromText } from "@/lib/simple-admin/parseProduct";
import { listQueue, putQueued, type QueuedProduct } from "@/lib/simple-admin/offlineQueue";

export class OfflineError extends Error {
  constructor() {
    super("You are offline");
  }
}

export function productLink(slug: string): string {
  return `${window.location.origin}/product/${slug}`;
}

async function uploadImages(blobs: Blob[]): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < blobs.length; i++) {
    const blob = blobs[i];
    const file = new File([blob], `product-photo-${i + 1}.jpg`, { type: blob.type || "image/jpeg" });
    urls.push(await uploadMedia(file, "products"));
  }
  return urls;
}

/** Attempts to sync one queued item. Throws on failure; never marks partial state. */
export async function syncQueueItem(item: QueuedProduct): Promise<QueuedProduct> {
  if (typeof navigator !== "undefined" && !navigator.onLine) throw new OfflineError();

  const parsed = parseProductFromText(item.text);
  if (!parsed.name) throw new Error("The product name could not be read from the saved message.");
  if (!parsed.priceNaira) throw new Error("The price could not be read from the saved message.");

  const urls = await uploadImages(item.images);
  const slug = `${slugify(parsed.name) || "product"}-${Date.now().toString(36).slice(-5)}`;

  const res = await createSyncedProduct({
    data: {
      name: parsed.name,
      slug,
      price_cents: Math.round(parsed.priceNaira * 100),
      description: parsed.description || null,
      sizes: parsed.sizes,
      colors: parsed.colors,
      stock: parsed.stock ?? 1,
      images: padImages(urls),
    },
  });

  const done: QueuedProduct = {
    ...item,
    status: "synced",
    slug: res.slug,
    link: productLink(res.slug),
    error: undefined,
  };
  await putQueued(done);
  return done;
}

/** Syncs every pending/failed item in order. Returns the updated queue. */
export async function syncQueue(): Promise<QueuedProduct[]> {
  const items = await listQueue();
  let updated: QueuedProduct[] = items;
  for (const item of items) {
    if (item.status === "synced") continue;
    if (typeof navigator !== "undefined" && !navigator.onLine) break;
    const syncing: QueuedProduct = { ...item, status: "syncing", error: undefined };
    await putQueued(syncing);
    updated = updated.map((q) => (q.id === item.id ? syncing : q));
    try {
      const done = await syncQueueItem(item);
      updated = updated.map((q) => (q.id === item.id ? done : q));
    } catch (err) {
      const failed: QueuedProduct = {
        ...item,
        status: (err as Error)?.name === "OfflineError" ? "pending" : "failed",
        error: (err as Error)?.message || "Could not send this product",
      };
      await putQueued(failed);
      updated = updated.map((q) => (q.id === item.id ? failed : q));
    }
  }
  return updated;
}
