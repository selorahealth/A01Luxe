import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";

Font.register({
  family: "SpaceGrotesk",
  fonts: [
    { src: "/fonts/SpaceGrotesk-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/SpaceGrotesk-Bold.ttf", fontWeight: 700 },
  ],
});

Font.register({
  family: "Montserrat",
  fonts: [
    { src: "/fonts/Montserrat-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Montserrat-Medium.ttf", fontWeight: 500 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Montserrat",   // body text
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: "SpaceGrotesk",
    fontWeight: 700,
    color: "#555",
    letterSpacing: 1,
  },
  storeName: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
  },
  logo: {
    width: 48,
    height: 48,
  },
  metaBox: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    padding: 10,
    marginBottom: 20,
    width: 220,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  metaLabel: {
    width: 80,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#d1d5db",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  colNo: { width: "8%" },
  colDesc: { width: "42%" },
  colQty: { width: "15%", textAlign: "center" },
  colPrice: { width: "17%", textAlign: "right" },
  colTotal: { width: "18%", textAlign: "right" },
  totals: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    width: 180,
    justifyContent: "space-between",
    marginBottom: 4,
  },
  grandTotal: {
    flexDirection: "row",
    backgroundColor: "#111",
    color: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 10,
    width: 180,
    justifyContent: "space-between",
    marginTop: 6,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 11,
    color: "#666",
  },
});

type ReceiptItem = {
  name: string;
  qty: number;
  price_cents: number;
  size?: string | null;
  color?: string | null;
};

type ReceiptProps = {
  orderId: string;
  createdAt: string;
  customerName: string;
  items: ReceiptItem[];
  subtotalCents: number;
  deliveryFeeCents?: number;
  totalCents: number;
  logoUrl?: string; // public URL of the logo
};

function formatNaira(cents: number) {
  return `₦${(cents / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function ReceiptDocument({
  orderId,
  createdAt,
  customerName,
  items,
  subtotalCents,
  deliveryFeeCents = 0,
  totalCents,
  logoUrl,
}: ReceiptProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>RECEIPT</Text>
            <Text style={styles.storeName}>A01luxe Fashion Store</Text>
          </View>
          {logoUrl && <Image src={logoUrl} style={styles.logo} />}
        </View>

        {/* Meta */}
        <View style={styles.metaBox}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Order ID:</Text>
            <Text>{orderId}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Date & Time:</Text>
            <Text>{formatDate(createdAt)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Customer:</Text>
            <Text>{customerName}</Text>
          </View>
        </View>

        {/* Order Details */}
        <Text style={styles.sectionTitle}>Order Details</Text>
        <Text style={{ marginBottom: 6, fontWeight: "bold" }}>Order</Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.colNo}>No.</Text>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colQty}>Quantity</Text>
          <Text style={styles.colPrice}>Unit Price</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>

        {/* Table Rows */}
        {items.map((item, idx) => {
          const desc = [
            item.name,
            item.size ? `Size ${item.size}` : null,
            item.color ? item.color : null,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.colNo}>{idx + 1}.</Text>
              <Text style={styles.colDesc}>{desc}</Text>
              <Text style={styles.colQty}>{item.qty}</Text>
              <Text style={styles.colPrice}>{formatNaira(item.price_cents)}</Text>
              <Text style={styles.colTotal}>
                {formatNaira(item.price_cents * item.qty)}
              </Text>
            </View>
          );
        })}

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Sub Total</Text>
            <Text>{formatNaira(subtotalCents)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Delivery</Text>
            <Text>{formatNaira(deliveryFeeCents)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Tax</Text>
            <Text>₦0.00</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>TOTAL</Text>
            <Text>{formatNaira(totalCents)}</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Thank You For Shopping With Us!</Text>
      </Page>
    </Document>
  );
}
