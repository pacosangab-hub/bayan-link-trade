// Delivery method definitions shared across RFQ, offers, and orders.
export type DeliveryMethodKey =
  | "pickup_warehouse"
  | "third_party_carrier"
  | "supplier_owned_logistics";

export const DELIVERY_METHODS: Record<DeliveryMethodKey, {
  key: DeliveryMethodKey;
  label: string;
  short: string;
  description: string;
  timeline: string[];
  buyerActions: string[];
}> = {
  pickup_warehouse: {
    key: "pickup_warehouse",
    label: "Pick Up at Warehouse",
    short: "Warehouse Pickup",
    description: "Buyer picks up the order from the supplier's warehouse or pickup location.",
    timeline: [
      "Order Created",
      "Payment Protected",
      "Supplier Preparing Order",
      "Ready for Pickup",
      "Picked Up",
      "Buyer Confirmed",
      "Completed",
    ],
    buyerActions: ["Confirm Picked Up", "Report Problem", "Message Supplier"],
  },
  third_party_carrier: {
    key: "third_party_carrier",
    label: "Third-Party Carrier with Tracking",
    short: "3rd-Party Carrier",
    description: "Order is delivered through a third-party logistics provider with tracking details.",
    timeline: [
      "Order Created",
      "Payment Protected",
      "Supplier Preparing Order",
      "Handed to Carrier",
      "In Transit",
      "Out for Delivery",
      "Delivered",
      "Buyer Confirmed",
      "Completed",
    ],
    buyerActions: ["Track Package", "Confirm Delivery", "Report Problem", "Message Supplier"],
  },
  supplier_owned_logistics: {
    key: "supplier_owned_logistics",
    label: "Supplier-Owned Logistics",
    short: "Supplier Delivery",
    description: "Supplier delivers the order using their own delivery team or fleet.",
    timeline: [
      "Order Created",
      "Payment Protected",
      "Supplier Preparing Order",
      "Scheduled for Delivery",
      "Out for Delivery",
      "Delivered",
      "Buyer Confirmed",
      "Completed",
    ],
    buyerActions: ["Confirm Delivery", "Report Problem", "Message Supplier"],
  },
};

export const DELIVERY_METHOD_LIST = Object.values(DELIVERY_METHODS);

export function deliveryLabel(key?: string | null): string {
  if (!key) return "Not selected";
  const m = DELIVERY_METHODS[key as DeliveryMethodKey];
  return m ? m.label : key;
}
