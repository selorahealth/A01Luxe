# A01Luxe Backend Setup Export

Use this when recreating the backend in a personal Supabase/Firebase-style project.

## Current backend model

- **Auth roles:** `user_roles` stores `admin` and `staff`; roles are not stored on customer/user profiles.
- **Staff permissions:** each staff role row includes permissions such as `products`, `orders`, `staffs`, `accounts`, `content`, and `notifications`.
- **Products:** public storefront reads safe product fields only; internal source fields stay admin/staff-only.
- **Orders:** customers create orders only through the validated `create_order_public` RPC. Tracking uses exact order ID through `track_order_public`.
- **Receipts:** receipt uploads update an order through `upload_receipt_public`, then the storefront opens WhatsApp with the order ID prefilled.
- **Settings:** A01Luxe is the default brand, logo, colors, footer, and currency.

## Migration steps

1. Create the database schema from every SQL file in `supabase/migrations/`, in filename order.
2. Confirm Row Level Security is enabled on all public tables.
3. Confirm public-schema tables have explicit access grants for the roles their policies allow.
4. Create a private `media` storage bucket and allow receipt uploads only under `receipts/`.
5. Add backend runtime variables: backend URL, publishable key, service-role key, database URL, and the Lovable email/API key if using Lovable Emails.
6. Create the first admin user, then add a matching `user_roles` row with role `admin` and all permissions.
7. Upload public assets to `/public`: `A01Luxe-pfp.png`, `e.png`, and `hero-video.mp4`.

## Admin defaults

- Brand: `A01Luxe`
- Logo: `/A01Luxe-pfp.png`
- Currency: `₦` / `NGN`
- Accent: `#D4FF00`
- Background: `#212121`
- Foreground: `#F4EEE8`

## Important security rules

- Never put roles on a general profile/users table.
- Only admins can add, remove, or change staff roles.
- Staff can only see admin tabs listed in their permissions.
- Public users must not read full order/customer data.
- Product internal `cc` values must remain admin/staff-only.

To connect a separate personal backend, replace the environment variables in the hosting platform and run the migrations there first; do not switch the app before the schema and admin user exist.