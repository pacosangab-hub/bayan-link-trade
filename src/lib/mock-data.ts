// Mock data powering the PSG clickable prototype.
// No backend — all reads happen in-memory.

export type Supplier = {
  id: string;
  name: string;
  type: "Manufacturer" | "Distributor" | "Farmer Co-op" | "Importer";
  location: string;
  region: string;
  verified: boolean;
  goldSupplier: boolean;
  yearsOperating: number;
  rating: number;
  reviews: number;
  transactions: number;
  repeatBuyers: number;
  responseTime: string;
  leadTime: string;
  permits: string[];
  description: string;
  cover: string;
  categories: string[];
};

export type Product = {
  id: string;
  supplierId: string;
  title: string;
  category: string;
  industry?: string;
  unit: string;
  moq: number;
  pricePhp: number;
  tierPricing: { qty: number; price: number }[];
  leadTimeDays: number;
  image: string;
  stock: string;
  description: string;
  origin: string;
  tags?: string[];
  restricted?: boolean;
  compliance?: string;
};


export type RFQStatus =
  | "Draft"
  | "Open"
  | "Receiving Quotes"
  | "Awaiting Decision"
  | "Supplier Selected"
  | "Order Created"
  | "Completed"
  | "Closed"
  | "Awarded";

export type RFQ = {
  id: string;
  buyer: string;
  buyerType: string;
  buyerVerified?: boolean;
  title: string;
  category: string;
  qty: string;
  unit?: string;
  recurring?: boolean;
  budgetPhp: string;
  deliverBy: string;
  deliveryLocation?: string;
  region: string;
  postedAgo: string;
  description: string;
  responses: number;
  status: RFQStatus;
  nextAction?: string;
  selectedSupplierId?: string;
  quotes: {
    supplierId: string;
    pricePhp: number;
    moq: number;
    leadTimeDays: number;
    note: string;
    deliveryFee?: number;
    paymentTerms?: string;
  }[];
};

export type Order = {
  id: string;
  buyer: string;
  supplierId: string;
  items: { productId: string; qty: number; price: number }[];
  totalPhp: number;
  placed: string;
  escrowState: EscrowState;
  trackingNote?: string;
};

export type EscrowState =
  | "Awaiting Supplier Acceptance"
  | "Funds Held in Escrow"
  | "Preparing Shipment"
  | "In Transit"
  | "Delivered — Awaiting Confirmation"
  | "Released to Supplier"
  | "Disputed";

export type Conversation = {
  id: string;
  with: string;
  withRole: "Buyer" | "Supplier";
  lastMessage: string;
  unread: number;
  messages: { from: "me" | "them"; text: string; at: string }[];
};

const img = (q: string, seed: number) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=800&q=70&ixid=${encodeURIComponent(q)}`;

// Use stable Unsplash IDs that exist (curated commerce-friendly photos).
const I = {
  rice: "1586201375761-83865001e31c",
  fish: "1535473895227-bdecb20fb157",
  tomato: "1546470427-e26264be0b0d",
  coffee: "1442550528053-c431ecb55509",
  bottle: "1550583724-b2692b85b150",
  paper: "1586023492125-27b2c045efd7",
  cement: "1581094288338-2314dddb7ece",
  meds: "1584308666744-24d5c474f2ae",
  cocoa: "1481391319762-47dff72954d9",
  flour: "1509440159596-0249088772ff",
  factory: "1565793979206-6471901eba0c",
  farm: "1500595046743-cd271d694d30",
  warehouse: "1586528116311-ad8dd3c8310d",
  hands: "1521737604893-d14cc237f11d",
};

export const suppliers: Supplier[] = [
  {
    id: "sup_001",
    name: "Bulacan Grain & Rice Mills Inc.",
    type: "Manufacturer",
    location: "Malolos, Bulacan",
    region: "Central Luzon",
    verified: true,
    goldSupplier: true,
    yearsOperating: 14,
    rating: 4.8,
    reviews: 312,
    transactions: 1840,
    repeatBuyers: 268,
    responseTime: "≤ 2 hrs",
    leadTime: "1–3 days",
    permits: ["DTI", "BIR", "FDA", "Mayor's Permit"],
    description:
      "Family-run rice mill operating since 2011. Specializing in NFA-grade premium and well-milled rice for foodservice and retail.",
    cover: img("rice mill", parseInt(I.rice)) ? `https://images.unsplash.com/photo-${I.rice}?auto=format&fit=crop&w=1200&q=70` : "",
    categories: ["Rice & Grains", "Flour"],
  },
  {
    id: "sup_002",
    name: "Pampanga Fresh Catch Coop",
    type: "Farmer Co-op",
    location: "Sasmuan, Pampanga",
    region: "Central Luzon",
    verified: true,
    goldSupplier: false,
    yearsOperating: 8,
    rating: 4.6,
    reviews: 142,
    transactions: 640,
    repeatBuyers: 92,
    responseTime: "≤ 4 hrs",
    leadTime: "Same day — Metro Manila",
    permits: ["DTI", "BFAR", "Mayor's Permit"],
    description: "Cooperative of 120+ fisherfolk delivering bangus, tilapia, and shrimp daily to NCR foodservice.",
    cover: `https://images.unsplash.com/photo-${I.fish}?auto=format&fit=crop&w=1200&q=70`,
    categories: ["Seafood", "Frozen"],
  },
  {
    id: "sup_003",
    name: "Nueva Ecija Tomato Growers",
    type: "Farmer Co-op",
    location: "Cabanatuan, Nueva Ecija",
    region: "Central Luzon",
    verified: true,
    goldSupplier: false,
    yearsOperating: 5,
    rating: 4.4,
    reviews: 76,
    transactions: 312,
    repeatBuyers: 41,
    responseTime: "≤ 6 hrs",
    leadTime: "1–2 days",
    permits: ["DTI", "DA", "Mayor's Permit"],
    description: "Direct-from-farm tomatoes, onions, and garlic. Pre-graded for restaurant kitchens.",
    cover: `https://images.unsplash.com/photo-${I.tomato}?auto=format&fit=crop&w=1200&q=70`,
    categories: ["Vegetables", "Produce"],
  },
  {
    id: "sup_004",
    name: "Cavite Roasters & Co.",
    type: "Manufacturer",
    location: "Silang, Cavite",
    region: "CALABARZON",
    verified: true,
    goldSupplier: true,
    yearsOperating: 11,
    rating: 4.9,
    reviews: 421,
    transactions: 2100,
    repeatBuyers: 380,
    responseTime: "≤ 1 hr",
    leadTime: "2–4 days",
    permits: ["DTI", "BIR", "FDA", "HACCP"],
    description: "Specialty coffee roaster supplying cafes, hotels, and offices nationwide. Robusta and Arabica blends.",
    cover: `https://images.unsplash.com/photo-${I.coffee}?auto=format&fit=crop&w=1200&q=70`,
    categories: ["Beverages", "Coffee"],
  },
  {
    id: "sup_005",
    name: "Cebu Pharma Distribution",
    type: "Distributor",
    location: "Mandaue, Cebu",
    region: "Central Visayas",
    verified: true,
    goldSupplier: true,
    yearsOperating: 22,
    rating: 4.7,
    reviews: 580,
    transactions: 3400,
    repeatBuyers: 612,
    responseTime: "≤ 3 hrs",
    leadTime: "2–5 days",
    permits: ["DTI", "BIR", "FDA", "PDEA License"],
    description: "Licensed pharma distributor for OTC medicines, vitamins, and medical supplies. Serves 800+ pharmacies.",
    cover: `https://images.unsplash.com/photo-${I.meds}?auto=format&fit=crop&w=1200&q=70`,
    categories: ["Pharma", "Medical Supplies"],
  },
  {
    id: "sup_006",
    name: "Davao Cement & Hardware Corp.",
    type: "Distributor",
    location: "Davao City",
    region: "Davao Region",
    verified: true,
    goldSupplier: false,
    yearsOperating: 18,
    rating: 4.5,
    reviews: 198,
    transactions: 880,
    repeatBuyers: 156,
    responseTime: "≤ 5 hrs",
    leadTime: "3–7 days",
    permits: ["DTI", "BIR", "DPWH Accred."],
    description: "Wholesale cement, rebar, and construction supplies. Project pricing available.",
    cover: `https://images.unsplash.com/photo-${I.cement}?auto=format&fit=crop&w=1200&q=70`,
    categories: ["Construction"],
  },
  {
    id: "sup_007",
    name: "Batangas Bottling Co.",
    type: "Manufacturer",
    location: "Lipa, Batangas",
    region: "CALABARZON",
    verified: true,
    goldSupplier: false,
    yearsOperating: 9,
    rating: 4.3,
    reviews: 88,
    transactions: 410,
    repeatBuyers: 60,
    responseTime: "≤ 4 hrs",
    leadTime: "3–5 days",
    permits: ["DTI", "BIR", "FDA"],
    description: "PET bottle and glass bottle manufacturer for beverage brands and food packers.",
    cover: `https://images.unsplash.com/photo-${I.bottle}?auto=format&fit=crop&w=1200&q=70`,
    categories: ["Packaging"],
  },
  {
    id: "sup_008",
    name: "Quezon City Paper Mills",
    type: "Manufacturer",
    location: "Novaliches, Quezon City",
    region: "NCR",
    verified: true,
    goldSupplier: false,
    yearsOperating: 6,
    rating: 4.2,
    reviews: 54,
    transactions: 230,
    repeatBuyers: 38,
    responseTime: "≤ 8 hrs",
    leadTime: "2–4 days",
    permits: ["DTI", "BIR"],
    description: "Tissue, napkins, takeout containers, and paper bags for foodservice and offices.",
    cover: `https://images.unsplash.com/photo-${I.paper}?auto=format&fit=crop&w=1200&q=70`,
    categories: ["Paper", "Disposables"],
  },
];

export const products: Product[] = [
  {
    id: "prd_001", supplierId: "sup_001",
    title: "Premium Well-Milled Rice (Sinandomeng)",
    category: "Rice & Grains", unit: "50 kg sack", moq: 10, pricePhp: 2450,
    tierPricing: [{ qty: 10, price: 2450 }, { qty: 50, price: 2380 }, { qty: 200, price: 2290 }],
    leadTimeDays: 2,
    image: `https://images.unsplash.com/photo-${I.rice}?auto=format&fit=crop&w=800&q=70`,
    stock: "In stock — 4,200 sacks", origin: "Bulacan",
    description: "Premium sinandomeng. Freshly milled weekly. Ideal for restaurants, carinderias, canteens. Delivered shrink-wrapped on pallets.",
  },
  {
    id: "prd_002", supplierId: "sup_002",
    title: "Fresh Bangus (Milkfish) — Whole, Iced",
    category: "Seafood", unit: "kg", moq: 50, pricePhp: 185,
    tierPricing: [{ qty: 50, price: 185 }, { qty: 200, price: 175 }, { qty: 500, price: 168 }],
    leadTimeDays: 1,
    image: `https://images.unsplash.com/photo-${I.fish}?auto=format&fit=crop&w=800&q=70`,
    stock: "Daily catch — order before 6 AM", origin: "Pampanga",
    description: "Whole bangus, deboned option +₱25/kg. Delivered same-day Metro Manila in styrofoam with ice.",
  },
  {
    id: "prd_003", supplierId: "sup_003",
    title: "Tomatoes — Restaurant Grade",
    category: "Vegetables", unit: "kg", moq: 20, pricePhp: 78,
    tierPricing: [{ qty: 20, price: 78 }, { qty: 100, price: 72 }, { qty: 500, price: 65 }],
    leadTimeDays: 2,
    image: `https://images.unsplash.com/photo-${I.tomato}?auto=format&fit=crop&w=800&q=70`,
    stock: "In stock — 2,800 kg", origin: "Nueva Ecija",
    description: "Hand-graded tomatoes, uniform size. Packed in 10-kg plastic crates.",
  },
  {
    id: "prd_004", supplierId: "sup_004",
    title: "House Blend Espresso Beans (Robusta-Arabica)",
    category: "Coffee", unit: "1 kg bag", moq: 5, pricePhp: 720,
    tierPricing: [{ qty: 5, price: 720 }, { qty: 25, price: 680 }, { qty: 100, price: 640 }],
    leadTimeDays: 3,
    image: `https://images.unsplash.com/photo-${I.coffee}?auto=format&fit=crop&w=800&q=70`,
    stock: "Roasted to order", origin: "Cavite + Benguet",
    description: "Medium-dark roast. Chocolate, caramel, light citrus. Vacuum-sealed.",
  },
  {
    id: "prd_005", supplierId: "sup_005",
    title: "Paracetamol 500mg — 100s Blister Box",
    category: "Pharma", unit: "box (100 tabs)", moq: 50, pricePhp: 165,
    tierPricing: [{ qty: 50, price: 165 }, { qty: 200, price: 155 }, { qty: 1000, price: 142 }],
    leadTimeDays: 3,
    image: `https://images.unsplash.com/photo-${I.meds}?auto=format&fit=crop&w=800&q=70`,
    stock: "In stock — 18,400 boxes", origin: "Cebu (Distributed)",
    description: "FDA-registered. Generic. For licensed pharmacies only — Rx category B.",
  },
  {
    id: "prd_006", supplierId: "sup_006",
    title: "Portland Cement Type 1 — 40kg",
    category: "Construction", unit: "bag (40 kg)", moq: 100, pricePhp: 285,
    tierPricing: [{ qty: 100, price: 285 }, { qty: 500, price: 275 }, { qty: 2000, price: 262 }],
    leadTimeDays: 5,
    image: `https://images.unsplash.com/photo-${I.cement}?auto=format&fit=crop&w=800&q=70`,
    stock: "Project quantities available", origin: "Davao",
    description: "Type 1 ordinary Portland cement. Project pricing on request for >500 bags.",
  },
  {
    id: "prd_007", supplierId: "sup_007",
    title: "PET Bottle 500ml — Clear, with Cap",
    category: "Packaging", unit: "bundle (100 pcs)", moq: 20, pricePhp: 380,
    tierPricing: [{ qty: 20, price: 380 }, { qty: 100, price: 360 }, { qty: 500, price: 335 }],
    leadTimeDays: 4,
    image: `https://images.unsplash.com/photo-${I.bottle}?auto=format&fit=crop&w=800&q=70`,
    stock: "In stock", origin: "Batangas",
    description: "Food-grade PET. Custom labels available at additional cost.",
  },
  {
    id: "prd_008", supplierId: "sup_008",
    title: "Kraft Takeout Box — Medium (500 pcs)",
    category: "Paper", unit: "carton (500 pcs)", moq: 5, pricePhp: 1450,
    tierPricing: [{ qty: 5, price: 1450 }, { qty: 25, price: 1380 }, { qty: 100, price: 1295 }],
    leadTimeDays: 3,
    image: `https://images.unsplash.com/photo-${I.paper}?auto=format&fit=crop&w=800&q=70`,
    stock: "In stock — 220 cartons", origin: "Quezon City",
    description: "Microwaveable, leak-resistant kraft container. Stackable.",
  },
  {
    id: "prd_009", supplierId: "sup_001",
    title: "All-Purpose Flour — 25kg",
    category: "Flour", unit: "sack (25 kg)", moq: 8, pricePhp: 1180,
    tierPricing: [{ qty: 8, price: 1180 }, { qty: 40, price: 1130 }, { qty: 160, price: 1075 }],
    leadTimeDays: 2,
    image: `https://images.unsplash.com/photo-${I.flour}?auto=format&fit=crop&w=800&q=70`,
    stock: "In stock", origin: "Bulacan",
    description: "All-purpose flour for bakeries, pizzerias, and commissaries.",
  },
  {
    id: "prd_010", supplierId: "sup_004",
    title: "Cocoa Powder — Pure Unsweetened 1kg",
    category: "Beverages", unit: "1 kg pouch", moq: 10, pricePhp: 540,
    tierPricing: [{ qty: 10, price: 540 }, { qty: 50, price: 510 }, { qty: 200, price: 478 }],
    leadTimeDays: 4,
    image: `https://images.unsplash.com/photo-${I.cocoa}?auto=format&fit=crop&w=800&q=70`,
    stock: "In stock", origin: "Davao (sourced)",
    description: "100% pure unsweetened cocoa. For cafes, bakeries, and beverage commissaries.",
  },
  {
    id: "prd_011", supplierId: "sup_002",
    title: "Tilapia — Live & Iced",
    category: "Seafood", unit: "kg", moq: 30, pricePhp: 145,
    tierPricing: [{ qty: 30, price: 145 }, { qty: 150, price: 138 }, { qty: 400, price: 130 }],
    leadTimeDays: 1,
    image: `https://images.unsplash.com/photo-${I.fish}?auto=format&fit=crop&w=800&q=70`,
    stock: "Daily — order by 5 AM", origin: "Pampanga",
    description: "Live or iced tilapia. Average size 350–500g.",
  },
  {
    id: "prd_012", supplierId: "sup_008",
    title: "2-Ply Bathroom Tissue (48 rolls)",
    category: "Paper", unit: "carton (48 rolls)", moq: 5, pricePhp: 920,
    tierPricing: [{ qty: 5, price: 920 }, { qty: 30, price: 870 }, { qty: 120, price: 815 }],
    leadTimeDays: 2,
    image: `https://images.unsplash.com/photo-${I.paper}?auto=format&fit=crop&w=800&q=70`,
    stock: "In stock", origin: "Quezon City",
    description: "2-ply, 250-sheet rolls. Hotels, offices, restrooms.",
  },
];

export const rfqs: RFQ[] = [
  {
    id: "rfq_001",
    buyer: "Lola Nena's Carinderia Group", buyerType: "Carinderia (8 branches)", buyerVerified: true,
    title: "500 kg/month Premium Rice — Recurring Supply",
    category: "Rice & Grains",
    qty: "500 kg / month", unit: "kg", recurring: true,
    budgetPhp: "₱45–50 / kg",
    deliverBy: "Weekly drops, Mon",
    deliveryLocation: "Project 8 Commissary, Quezon City",
    region: "Metro Manila",
    postedAgo: "2 hrs ago",
    description:
      "We operate 8 branches in QC and Caloocan. Need consistent quality, weekly delivery to a central commissary in Project 8. Open to 6-month contract.",
    responses: 4,
    status: "Receiving Quotes",
    nextAction: "4 new quotes — Review now",
    quotes: [
      { supplierId: "sup_001", pricePhp: 46, moq: 200, leadTimeDays: 2, deliveryFee: 0, paymentTerms: "50% escrow / 50% on delivery", note: "Locked-in pricing for 6 months. Weekly delivery, free for orders ≥ 300 kg." },
      { supplierId: "sup_003", pricePhp: 48, moq: 100, leadTimeDays: 3, deliveryFee: 800, paymentTerms: "Full escrow", note: "Can mix grades on request. Delivery via partner trucker." },
    ],
  },
  {
    id: "rfq_002",
    buyer: "Casa Marikina Boutique Hotel", buyerType: "Hotel — 64 rooms", buyerVerified: true,
    title: "Tissue Starter Pack — 64 Rooms",
    category: "Paper",
    qty: "Setup pack + monthly resupply", unit: "carton", recurring: true,
    budgetPhp: "Open",
    deliverBy: "Within 2 weeks",
    deliveryLocation: "Marikina City",
    region: "Metro Manila",
    postedAgo: "1 day ago",
    description: "Looking for a hotel toiletries + tissue supplier. Want kraft-look packaging, eco-positioned. Monthly resupply schedule.",
    responses: 6,
    status: "Receiving Quotes",
    nextAction: "6 new quotes — Review now",
    quotes: [
      { supplierId: "sup_008", pricePhp: 870, moq: 30, leadTimeDays: 5, deliveryFee: 500, paymentTerms: "Full escrow", note: "Custom kraft line available. Sending sample pack at no cost." },
    ],
  },
  {
    id: "rfq_003",
    buyer: "BarakoBros Coffee", buyerType: "Café chain (12 outlets)", buyerVerified: true,
    title: "House Blend Espresso — 80 kg/month",
    category: "Coffee",
    qty: "80 kg / month", unit: "kg", recurring: true,
    budgetPhp: "≤ ₱700 / kg",
    deliverBy: "First delivery in 10 days",
    deliveryLocation: "Pasig commissary + Cavite hub",
    region: "Metro Manila + Cavite",
    postedAgo: "3 days ago",
    description: "Switching roaster. Want chocolatey medium-dark profile. Will cup-test 3 samples.",
    responses: 9,
    status: "Awaiting Decision",
    nextAction: "9 quotes ready — Decide soon",
    quotes: [
      { supplierId: "sup_004", pricePhp: 680, moq: 25, leadTimeDays: 3, deliveryFee: 400, paymentTerms: "Full escrow", note: "Will send 3 sample profiles by Friday. Free cupping at our roastery." },
    ],
  },
  {
    id: "rfq_004",
    buyer: "Sunrise Snack Foods", buyerType: "Food Manufacturer", buyerVerified: true,
    title: "Corrugated Packaging Boxes — 5,000 pieces",
    category: "Packaging",
    qty: "5,000 pcs (one-time)", unit: "pcs", recurring: false,
    budgetPhp: "≤ ₱22 / box",
    deliverBy: "3 weeks",
    deliveryLocation: "Biñan, Laguna",
    region: "Laguna",
    postedAgo: "6 hrs ago",
    description: "Need double-wall corrugated boxes 30x20x15 cm with 2-color flexo print. Sample approval required before mass production.",
    responses: 2,
    status: "Open",
    nextAction: "2 quotes so far — Share request",
    quotes: [
      { supplierId: "sup_007", pricePhp: 21, moq: 1000, leadTimeDays: 12, deliveryFee: 1200, paymentTerms: "30% escrow / 70% on delivery", note: "Can meet spec. Sample in 3 days." },
    ],
  },
  {
    id: "rfq_005",
    buyer: "Grill Master QC", buyerType: "Restaurant Chain (5 outlets)", buyerVerified: true,
    title: "Chicken Breast Supply — 300 kg/week",
    category: "Seafood",
    qty: "300 kg / week", unit: "kg", recurring: true,
    budgetPhp: "₱250–280 / kg",
    deliverBy: "Tue & Fri, 6 AM",
    deliveryLocation: "Quezon City central kitchen",
    region: "Metro Manila",
    postedAgo: "12 hrs ago",
    description: "Skinless, boneless chicken breast, ≤ 200g per piece. Cold-chain delivery required. NMIS-accredited supplier only.",
    responses: 0,
    status: "Open",
    nextAction: "No quotes yet — Share request",
    quotes: [],
  },
];

export const orders: Order[] = [
  {
    id: "ord_24011",
    buyer: "Lola Nena's Carinderia Group",
    supplierId: "sup_001",
    items: [{ productId: "prd_001", qty: 40, price: 2380 }],
    totalPhp: 40 * 2380,
    placed: "Today, 09:14",
    escrowState: "Preparing Shipment",
    trackingNote: "Shipment scheduled for tomorrow 6 AM via supplier truck.",
  },
  {
    id: "ord_24008",
    buyer: "Lola Nena's Carinderia Group",
    supplierId: "sup_003",
    items: [{ productId: "prd_003", qty: 120, price: 72 }],
    totalPhp: 120 * 72,
    placed: "Yesterday, 16:22",
    escrowState: "In Transit",
  },
  {
    id: "ord_23994",
    buyer: "BarakoBros Coffee",
    supplierId: "sup_004",
    items: [{ productId: "prd_004", qty: 25, price: 680 }],
    totalPhp: 25 * 680,
    placed: "Jun 22",
    escrowState: "Delivered — Awaiting Confirmation",
    trackingNote: "Delivered to Pasig commissary. Awaiting buyer confirmation to release escrow.",
  },
  {
    id: "ord_23901",
    buyer: "Casa Marikina Boutique Hotel",
    supplierId: "sup_008",
    items: [{ productId: "prd_012", qty: 30, price: 870 }],
    totalPhp: 30 * 870,
    placed: "Jun 18",
    escrowState: "Released to Supplier",
  },
  {
    id: "ord_23845",
    buyer: "Mercury Aid Pharmacy",
    supplierId: "sup_005",
    items: [{ productId: "prd_005", qty: 200, price: 155 }],
    totalPhp: 200 * 155,
    placed: "Jun 14",
    escrowState: "Released to Supplier",
  },
];

export const conversations: Conversation[] = [
  {
    id: "conv_001",
    with: "Bulacan Grain & Rice Mills Inc.",
    withRole: "Supplier",
    unread: 2,
    lastMessage: "Yes po, we can lock 6-month pricing at ₱46/kg.",
    messages: [
      { from: "me", text: "Hi! Saw your quote on RFQ-001. Can you confirm 6-month price lock?", at: "09:02" },
      { from: "them", text: "Yes po, we can lock 6-month pricing at ₱46/kg.", at: "09:08" },
      { from: "them", text: "Free delivery for ≥ 300 kg per drop. Schedule every Monday 6 AM.", at: "09:09" },
    ],
  },
  {
    id: "conv_002",
    with: "Cavite Roasters & Co.",
    withRole: "Supplier",
    unread: 0,
    lastMessage: "Cupping at our roastery Saturday 10 AM — sound good?",
    messages: [
      { from: "them", text: "Sending 3 sample profiles tomorrow.", at: "Yesterday" },
      { from: "me", text: "Perfect. Can we cup together?", at: "Yesterday" },
      { from: "them", text: "Cupping at our roastery Saturday 10 AM — sound good?", at: "08:30" },
    ],
  },
  {
    id: "conv_003",
    with: "Pampanga Fresh Catch Coop",
    withRole: "Supplier",
    unread: 1,
    lastMessage: "Tomorrow's bangus is 380g avg, ₱180/kg ok?",
    messages: [
      { from: "them", text: "Tomorrow's bangus is 380g avg, ₱180/kg ok?", at: "06:14" },
    ],
  },
];

// ============================================================================
// Expanded 2026 catalog — 30 industries, 60+ suppliers, 150+ products.
// Data is generated at module load and pushed into the exported arrays.
// ============================================================================

type IndustryDef = {
  key: string;
  icon: string;
  compliance?: string;
  restricted?: boolean;
  suppliers: {
    name: string;
    type: Supplier["type"];
    location: string;
    region: string;
    goldSupplier?: boolean;
  }[];
  products: {
    title: string;
    unit: string;
    moq: number;
    price: number;
    tags?: string[];
    restricted?: boolean;
    compliance?: string;
  }[];
};

const INDUSTRY_DEFS: IndustryDef[] = [
  {
    key: "Food Manufacturing & FMCG", icon: "🍜", compliance: "FDA Docs Required",
    suppliers: [
      { name: "San Pablo Food Corp.", type: "Manufacturer", location: "San Pablo, Laguna", region: "CALABARZON", goldSupplier: true },
      { name: "Metro FMCG Distribution", type: "Distributor", location: "Valenzuela City", region: "NCR" },
    ],
    products: [
      { title: "Soy Sauce Gallon (4L)", unit: "gallon", moq: 12, price: 340 },
      { title: "Instant Noodles Bulk Case (72 packs)", unit: "case", moq: 5, price: 780 },
      { title: "Canned Sardines Case (100 cans)", unit: "case", moq: 4, price: 3200 },
      { title: "Frozen Siomai Pack (500 pcs)", unit: "pack", moq: 10, price: 950 },
      { title: "Cooking Oil 16L Tin", unit: "tin", moq: 6, price: 1450 },
      { title: "Snack Chips Bulk Carton (48 packs)", unit: "carton", moq: 8, price: 1120 },
      { title: "Condiment Starter Pack (Vinegar, Patis, Toyo)", unit: "kit", moq: 20, price: 620 },
    ],
  },
  {
    key: "Agricultural & Fresh Produce", icon: "🥬",
    suppliers: [
      { name: "Nueva Vizcaya Highland Farms", type: "Farmer Co-op", location: "Bambang, Nueva Vizcaya", region: "Central Luzon" },
      { name: "Batangas Poultry Cooperative", type: "Farmer Co-op", location: "Lipa, Batangas", region: "CALABARZON" },
    ],
    products: [
      { title: "Corn Grits Sack (50kg)", unit: "sack", moq: 10, price: 1650 },
      { title: "Fresh Lettuce Crate (Romaine/Iceberg)", unit: "crate (10kg)", moq: 5, price: 850 },
      { title: "White Onion — Bulk Sack (25kg)", unit: "sack", moq: 4, price: 2800 },
      { title: "Fresh Egg Tray (30 pcs) — Bulk", unit: "tray", moq: 30, price: 245 },
      { title: "Cavendish Banana Box (13kg)", unit: "box", moq: 10, price: 480 },
      { title: "Fresh Mushroom Pack (Oyster/Shiitake)", unit: "kg", moq: 20, price: 320 },
    ],
  },
  {
    key: "Beverages", icon: "🥤", compliance: "FDA Docs Required",
    suppliers: [
      { name: "AquaPure Bottling Inc.", type: "Manufacturer", location: "Antipolo, Rizal", region: "CALABARZON", goldSupplier: true },
      { name: "Isla Juice Concentrates", type: "Manufacturer", location: "Naga City", region: "Bicol Region" },
    ],
    products: [
      { title: "Purified Water Gallon (5-gal Refill)", unit: "gallon", moq: 100, price: 55 },
      { title: "Coconut Water Bottles (330ml, case of 24)", unit: "case", moq: 20, price: 720 },
      { title: "Fruit Juice Concentrate Drum (20L)", unit: "drum", moq: 5, price: 4200 },
      { title: "RTD Iced Tea Bottles (500ml, case of 24)", unit: "case", moq: 15, price: 640 },
      { title: "Soft Drink Case (12oz x 24)", unit: "case", moq: 20, price: 480 },
      { title: "Energy Drink Case (250ml x 24)", unit: "case", moq: 10, price: 980 },
      { title: "Coffee Concentrate Pouch (2L)", unit: "pouch", moq: 12, price: 780 },
    ],
  },
  {
    key: "Bakery & Confectionery", icon: "🥖",
    suppliers: [
      { name: "Malolos Baking Supplies Co.", type: "Distributor", location: "Malolos, Bulacan", region: "Central Luzon" },
      { name: "Sweet Ph. Confectionery", type: "Manufacturer", location: "Marikina City", region: "NCR" },
    ],
    products: [
      { title: "White Sugar Sack (50kg, Refined)", unit: "sack", moq: 10, price: 3200 },
      { title: "Instant Dry Yeast Pack (500g x 20)", unit: "carton", moq: 5, price: 1450 },
      { title: "Chocolate Chips Bulk (5kg pack)", unit: "pack", moq: 4, price: 2100 },
      { title: "Cake Boxes (10x10 white, 100 pcs)", unit: "bundle", moq: 10, price: 420 },
      { title: "Shortening Tin (7kg)", unit: "tin", moq: 6, price: 1350 },
      { title: "Baking Equipment Starter Set", unit: "set", moq: 1, price: 12500 },
    ],
  },
  {
    key: "Pharmaceutical & Health", icon: "💊", compliance: "Medical Docs Required",
    suppliers: [
      { name: "Manila MedSource Distribution", type: "Distributor", location: "Manila City", region: "NCR", goldSupplier: true },
      { name: "Iloilo Healthcare Traders", type: "Distributor", location: "Iloilo City", region: "Western Visayas" },
    ],
    products: [
      { title: "Medical Face Masks (3-ply, box of 50)", unit: "box", moq: 20, price: 85 },
      { title: "Isopropyl Alcohol 70% Gallon", unit: "gallon", moq: 12, price: 340 },
      { title: "Vitamin C 500mg Bottle (100 caps)", unit: "bottle", moq: 24, price: 220 },
      { title: "Surgical Gloves (Latex, box of 100)", unit: "box", moq: 20, price: 320 },
      { title: "Hospital Consumables Kit (Gauze, Cotton, Tape)", unit: "kit", moq: 10, price: 780 },
      { title: "Rapid Diagnostic Test Kit (25 tests)", unit: "kit", moq: 5, price: 2250, compliance: "Medical Docs Required" },
    ],
  },
  {
    key: "Personal Care & Cosmetics", icon: "🧴", compliance: "FDA Docs Required",
    suppliers: [
      { name: "Manila Private Label Beauty", type: "Manufacturer", location: "Pasig City", region: "NCR" },
      { name: "Cebu Cosmetic Solutions", type: "Manufacturer", location: "Cebu City", region: "Central Visayas" },
    ],
    products: [
      { title: "Private Label Soap Bars (100g x 100)", unit: "carton", moq: 5, price: 2400 },
      { title: "Shampoo Gallon (Salon Grade, 4L)", unit: "gallon", moq: 10, price: 620 },
      { title: "Body Lotion Bottles (500ml x 24)", unit: "case", moq: 8, price: 1450 },
      { title: "SPF50 Sunscreen Tubes (60ml x 24)", unit: "case", moq: 10, price: 2200 },
      { title: "Hair Color Kit (Salon Pack)", unit: "kit", moq: 20, price: 340 },
      { title: "Nail Salon Supply Set (Polish, Files, Remover)", unit: "set", moq: 10, price: 1250 },
      { title: "Cosmetic Packaging Set (Jars + Bottles, 100 pcs)", unit: "set", moq: 5, price: 1850 },
    ],
  },
  {
    key: "Cleaning & Hygiene", icon: "🧼",
    suppliers: [
      { name: "SparkleClean Chemicals Corp.", type: "Manufacturer", location: "Cainta, Rizal", region: "CALABARZON" },
      { name: "Davao Hygiene Wholesale", type: "Distributor", location: "Davao City", region: "Davao Region" },
    ],
    products: [
      { title: "Dishwashing Liquid Gallon (4L)", unit: "gallon", moq: 12, price: 380 },
      { title: "Laundry Detergent Sack (Powder, 25kg)", unit: "sack", moq: 5, price: 2650 },
      { title: "Chlorine Bleach Gallon (4L)", unit: "gallon", moq: 12, price: 260 },
      { title: "Toilet Bowl Cleaner Case (1L x 12)", unit: "case", moq: 6, price: 780 },
      { title: "Floor Cleaner Gallon (Lemon Scent)", unit: "gallon", moq: 10, price: 340 },
      { title: "Industrial Degreaser Drum (200L)", unit: "drum", moq: 2, price: 8500 },
      { title: "Janitorial Supply Kit (Mop, Bucket, Chemicals)", unit: "kit", moq: 5, price: 1850 },
    ],
  },
  {
    key: "Construction Materials", icon: "🧱",
    suppliers: [
      { name: "BGC Fit-Out Materials", type: "Distributor", location: "Taguig City", region: "NCR", goldSupplier: true },
      { name: "Bacolod Builders Depot", type: "Distributor", location: "Bacolod City", region: "Western Visayas" },
    ],
    products: [
      { title: "Rebar 10mm x 6m (Deformed, Grade 40)", unit: "piece", moq: 100, price: 285 },
      { title: "CHB Hollow Blocks 4\" (Standard)", unit: "piece", moq: 500, price: 14 },
      { title: "Ceramic Floor Tiles 60x60 (Box of 4)", unit: "box", moq: 50, price: 480 },
      { title: "PVC Pipes 4\" x 10ft (Sanitary)", unit: "length", moq: 20, price: 620 },
      { title: "Electrical Wire THHN 3.5mm (150m Roll)", unit: "roll", moq: 5, price: 3450 },
      { title: "Latex Paint Gallon (Premium White)", unit: "gallon", moq: 12, price: 780 },
      { title: "Plumbing Supply Kit (Fittings + Valves)", unit: "kit", moq: 10, price: 1650 },
    ],
  },
  {
    key: "Industrial Equipment & Machinery", icon: "⚙️",
    suppliers: [
      { name: "Calamba Industrial Equipment Supply", type: "Distributor", location: "Calamba, Laguna", region: "CALABARZON", goldSupplier: true },
      { name: "CDO Machinery Traders", type: "Distributor", location: "Cagayan de Oro", region: "Northern Mindanao" },
    ],
    products: [
      { title: "Diesel Generator Set (10kVA, Silent Type)", unit: "unit", moq: 1, price: 185000 },
      { title: "Centrifugal Water Pump (2HP)", unit: "unit", moq: 1, price: 24500 },
      { title: "Welding Machine (Inverter, 250A)", unit: "unit", moq: 1, price: 12500 },
      { title: "Air Compressor (5HP, 200L Tank)", unit: "unit", moq: 1, price: 28500 },
      { title: "Conveyor Belt Rubber Roll (600mm x 10m)", unit: "roll", moq: 2, price: 18500 },
      { title: "Industrial Safety Equipment Set (Helmet, Boots, Vest)", unit: "set", moq: 20, price: 1250 },
      { title: "Forklift Rental Package (Monthly)", unit: "month", moq: 1, price: 45000 },
    ],
  },
  {
    key: "Chemicals & Raw Materials", icon: "⚗️", compliance: "Chemical Review Required",
    suppliers: [
      { name: "Batangas Chemical Distribution", type: "Distributor", location: "Batangas City", region: "CALABARZON" },
      { name: "Manila Industrial Chemicals", type: "Importer", location: "Tondo, Manila", region: "NCR" },
    ],
    products: [
      { title: "Food-Grade Additive Pack (Preservatives)", unit: "pack (5kg)", moq: 10, price: 1850, compliance: "FDA Docs Required" },
      { title: "Paint Raw Material Kit (Pigments + Binder)", unit: "kit", moq: 5, price: 6500 },
      { title: "Polyester Resin Drum (200L)", unit: "drum", moq: 2, price: 18500 },
      { title: "Industrial Cleaning Chemical Drum (200L)", unit: "drum", moq: 2, price: 9800 },
      { title: "Water Treatment Chemicals (Chlorine Tabs, 25kg)", unit: "pail", moq: 4, price: 4200 },
      { title: "Industrial Solvent (Acetone, 20L)", unit: "pail", moq: 4, price: 3200 },
      { title: "Industrial Adhesive Drum (200L)", unit: "drum", moq: 2, price: 22500 },
    ],
  },
  {
    key: "Packaging Materials", icon: "📦",
    suppliers: [
      { name: "Laguna Packaging Solutions", type: "Manufacturer", location: "Biñan, Laguna", region: "CALABARZON" },
      { name: "Cebu Pack & Print", type: "Manufacturer", location: "Mandaue, Cebu", region: "Central Visayas" },
    ],
    products: [
      { title: "Corrugated Boxes (12x12x10, Bundle 25)", unit: "bundle", moq: 10, price: 480 },
      { title: "Sticker Label Rolls (500 pcs, Custom)", unit: "roll", moq: 20, price: 380 },
      { title: "Stand-Up Pouches (250g, 500 pcs)", unit: "carton", moq: 5, price: 1850 },
      { title: "Shrink Wrap Roll (500mm x 300m)", unit: "roll", moq: 10, price: 620 },
      { title: "Tin Can Packaging (Round, 500ml x 100)", unit: "carton", moq: 5, price: 2200 },
      { title: "Glass Bottles (Amber, 100ml x 100)", unit: "carton", moq: 5, price: 1450 },
    ],
  },
  {
    key: "Textile & Garments", icon: "🧵",
    suppliers: [
      { name: "Laguna Textile Mills", type: "Manufacturer", location: "Sta. Rosa, Laguna", region: "CALABARZON" },
      { name: "Divisoria Fabric Wholesale", type: "Distributor", location: "Manila City", region: "NCR" },
    ],
    products: [
      { title: "Uniform Fabric Roll (Polyester, 50m)", unit: "roll", moq: 5, price: 4800 },
      { title: "Cotton T-Shirt Bulk (Plain, 100 pcs)", unit: "bundle", moq: 5, price: 6500 },
      { title: "Hotel Linen Set (Sheets + Pillowcases, 20 sets)", unit: "carton", moq: 2, price: 8500 },
      { title: "Zippers & Buttons Assortment (1000 pcs)", unit: "carton", moq: 5, price: 1250 },
      { title: "Embroidery Service Package (100 uniforms)", unit: "job", moq: 1, price: 6800 },
      { title: "Thread & Yarn Supply (Cotton, 100 spools)", unit: "carton", moq: 5, price: 1450 },
      { title: "Sports Apparel Bulk (Jerseys, 50 pcs)", unit: "bundle", moq: 2, price: 12500 },
    ],
  },
  {
    key: "Mining & Energy", icon: "⛏️", compliance: "Restricted Category",
    suppliers: [
      { name: "Luzon Mining Equipment Supply", type: "Distributor", location: "Baguio City", region: "Cordillera" },
      { name: "SunPower PH Solar Traders", type: "Distributor", location: "Quezon City", region: "NCR", goldSupplier: true },
    ],
    products: [
      { title: "Solar Panel Kit (5kW, Grid-Tie)", unit: "kit", moq: 1, price: 185000 },
      { title: "Generator Spare Parts Pack", unit: "kit", moq: 2, price: 12500 },
      { title: "Mining Safety Gear Set (Helmet, Lamp, Vest)", unit: "set", moq: 10, price: 3450 },
      { title: "Industrial Drill Bit Set (Carbide, 20 pcs)", unit: "set", moq: 5, price: 4200 },
      { title: "Solar Water Pumping System (3HP)", unit: "unit", moq: 1, price: 68500 },
      { title: "Power Distribution Panel (3-Phase, 400A)", unit: "unit", moq: 1, price: 42500 },
      { title: "Blasting & Explosives Supply", unit: "job", moq: 1, price: 0, restricted: true, compliance: "Restricted — Admin Approval Required" },
    ],
  },
  {
    key: "IT & Telecommunications", icon: "💻",
    suppliers: [
      { name: "Makati POS Hardware Supply", type: "Distributor", location: "Makati City", region: "NCR", goldSupplier: true },
      { name: "Cebu IT Wholesale", type: "Distributor", location: "Cebu City", region: "Central Visayas" },
    ],
    products: [
      { title: "CCTV Camera Set (4-ch NVR + 4 IP Cams)", unit: "set", moq: 1, price: 18500 },
      { title: "Network Switch 24-Port Gigabit (Managed)", unit: "unit", moq: 2, price: 9800 },
      { title: "Structured Cabling Kit (Cat6, 305m box)", unit: "box", moq: 5, price: 4800 },
      { title: "Office Laptops Bulk (Core i5, 10 units)", unit: "bundle", moq: 1, price: 285000 },
      { title: "POS Hardware Kit (Terminal + Printer + Scanner)", unit: "kit", moq: 2, price: 18500 },
      { title: "Rack Server (2U, 32GB RAM, 2TB SSD)", unit: "unit", moq: 1, price: 145000 },
      { title: "Telecom Equipment Kit (Router + AP + Modem)", unit: "kit", moq: 5, price: 12500 },
    ],
  },
  {
    key: "Financial Services Support", icon: "🏦",
    suppliers: [
      { name: "Peso Terminal Systems", type: "Distributor", location: "Ortigas, Pasig", region: "NCR" },
      { name: "Manila Vault & Safe Traders", type: "Distributor", location: "Binondo, Manila", region: "NCR" },
    ],
    products: [
      { title: "Payment POS Terminal (EMV + NFC)", unit: "unit", moq: 5, price: 8500 },
      { title: "Thermal Receipt Paper Rolls (80mm x 100)", unit: "carton", moq: 10, price: 1250 },
      { title: "Cash Counting Machine (UV Detect)", unit: "unit", moq: 1, price: 18500 },
      { title: "Fireproof Safe Vault (Medium, 60L)", unit: "unit", moq: 1, price: 24500 },
      { title: "Queue Number System (Digital, 4-window)", unit: "set", moq: 1, price: 32500 },
      { title: "ATM Consumables Kit (Receipt + Journal Paper)", unit: "kit", moq: 5, price: 3450 },
    ],
  },
  {
    key: "Electronics & Electrical", icon: "🔌",
    suppliers: [
      { name: "Raon Electronics Distribution", type: "Distributor", location: "Quiapo, Manila", region: "NCR" },
      { name: "Cebu Electrical Supply Co.", type: "Distributor", location: "Cebu City", region: "Central Visayas" },
    ],
    products: [
      { title: "LED Bulbs 9W Warm White (Case of 100)", unit: "case", moq: 5, price: 4800 },
      { title: "Battery Backup UPS (1500VA, Line-Interactive)", unit: "unit", moq: 5, price: 6500 },
      { title: "Electrical Wire THHN 5.5mm (150m Roll)", unit: "roll", moq: 5, price: 5200 },
      { title: "Lighting Product Set (Panel + Downlights)", unit: "set", moq: 10, price: 3450 },
      { title: "Appliance Parts Bulk (Motors + Capacitors, 50 pcs)", unit: "carton", moq: 3, price: 8500 },
      { title: "Circuit Breaker Assortment (10 pcs)", unit: "set", moq: 10, price: 1850 },
    ],
  },
  {
    key: "Printing & Media", icon: "🖨️",
    suppliers: [
      { name: "Print City Wholesale", type: "Distributor", location: "Sta. Cruz, Manila", region: "NCR" },
      { name: "Davao Sign & Print Depot", type: "Manufacturer", location: "Davao City", region: "Davao Region" },
    ],
    products: [
      { title: "Ink & Toner Bulk Pack (Assorted, 20 pcs)", unit: "carton", moq: 3, price: 8500 },
      { title: "Printing Paper Ream (A4, 80gsm, 10 reams)", unit: "carton", moq: 5, price: 1850 },
      { title: "Vinyl Tarpaulin Roll (13oz, 3.2m x 50m)", unit: "roll", moq: 2, price: 9800 },
      { title: "Signage Material Kit (Sintra + Vinyl Sheets)", unit: "kit", moq: 5, price: 3450 },
      { title: "Book Binding Supplies (Coils + Covers, 200 sets)", unit: "kit", moq: 2, price: 1850 },
      { title: "Digital Printing Service Package (1000 flyers)", unit: "job", moq: 1, price: 4800 },
      { title: "Commercial Offset Printing (5000 brochures)", unit: "job", moq: 1, price: 12500 },
    ],
  },
  {
    key: "Office Supplies & Stationery", icon: "📎",
    suppliers: [
      { name: "Manila Office Systems", type: "Distributor", location: "Makati City", region: "NCR" },
      { name: "Iloilo Office Depot", type: "Distributor", location: "Iloilo City", region: "Western Visayas" },
    ],
    products: [
      { title: "Notebook Bulk Pack (A5, 100 pcs)", unit: "carton", moq: 5, price: 1450 },
      { title: "Pens & Writing Instruments (Assorted, 500 pcs)", unit: "carton", moq: 3, price: 2200 },
      { title: "Printer Toner Cartridges (HP/Canon, 20 pcs)", unit: "carton", moq: 2, price: 12500 },
      { title: "Ink Refill Bottles (Assorted Colors, 50 pcs)", unit: "carton", moq: 5, price: 3450 },
      { title: "Filing & Storage Boxes (Legal, 50 pcs)", unit: "carton", moq: 5, price: 1850 },
      { title: "Office Furniture Package (5 Desks + 5 Chairs)", unit: "set", moq: 1, price: 48500 },
      { title: "Whiteboard + AV Equipment Kit", unit: "set", moq: 1, price: 22500 },
    ],
  },
  {
    key: "Restaurants & Food Service", icon: "🍽️",
    suppliers: [
      { name: "Kitchen Pro Equipment Wholesale", type: "Distributor", location: "Pasig City", region: "NCR", goldSupplier: true },
      { name: "Cebu Restaurant Supply Depot", type: "Distributor", location: "Cebu City", region: "Central Visayas" },
    ],
    products: [
      { title: "Commercial Rice Cooker (10L Gas)", unit: "unit", moq: 2, price: 18500 },
      { title: "Stainless Kitchen Prep Table (6ft)", unit: "unit", moq: 2, price: 12500 },
      { title: "Restaurant POS System Package", unit: "kit", moq: 1, price: 32500 },
      { title: "Food Packaging Set (Boxes + Utensils + Cups)", unit: "kit", moq: 10, price: 1850 },
      { title: "LPG Cylinder 50kg (Refill)", unit: "cylinder", moq: 5, price: 3450 },
      { title: "Commercial Refrigerator (2-Door Upright)", unit: "unit", moq: 1, price: 68500 },
      { title: "Kitchen Utensil Distributor Pack (Full Set)", unit: "set", moq: 5, price: 4800 },
    ],
  },
  {
    key: "Hotel & Hospitality", icon: "🏨",
    suppliers: [
      { name: "Cebu Hotel Supply Depot", type: "Distributor", location: "Mactan, Cebu", region: "Central Visayas", goldSupplier: true },
      { name: "Boracay Hospitality Wholesale", type: "Distributor", location: "Malay, Aklan", region: "Western Visayas" },
    ],
    products: [
      { title: "Hotel Towels — White Cotton (100 pcs)", unit: "carton", moq: 5, price: 12500 },
      { title: "Bed Linen Set (Queen, 20 sets)", unit: "carton", moq: 2, price: 18500 },
      { title: "Toiletry Amenity Kit (250 sets)", unit: "carton", moq: 4, price: 4800 },
      { title: "Hotel Room Furniture Package (Bed + Nightstand)", unit: "set", moq: 1, price: 42500 },
      { title: "Guest Room Supplies Kit (Slippers + Kettle + Hangers)", unit: "kit", moq: 20, price: 780 },
      { title: "Housekeeping Cart + Chemicals Kit", unit: "set", moq: 2, price: 18500 },
      { title: "Hotel Booking Software (Annual License, 50 rooms)", unit: "license", moq: 1, price: 68500 },
    ],
  },
  {
    key: "Events & Catering", icon: "🎉",
    suppliers: [
      { name: "Pasig Events & Catering Supply", type: "Distributor", location: "Pasig City", region: "NCR" },
      { name: "BGC Event Rentals", type: "Distributor", location: "Taguig City", region: "NCR" },
    ],
    products: [
      { title: "Disposable Tableware Set (500 pax)", unit: "set", moq: 2, price: 4800 },
      { title: "Catering Equipment Package (Chafing Dishes x 10)", unit: "set", moq: 1, price: 32500 },
      { title: "Event Lighting Rental (Par Cans + Truss, 1 day)", unit: "day", moq: 1, price: 18500 },
      { title: "Sound System Rental Package (Full Band Setup)", unit: "day", moq: 1, price: 22500 },
      { title: "Tent & Canopy Rental (10x10m, 1 day)", unit: "day", moq: 1, price: 12500 },
      { title: "Event Furniture Package (100 chairs + 20 tables)", unit: "set", moq: 1, price: 18500 },
      { title: "Bulk Food Ingredient Supply (200 pax menu)", unit: "job", moq: 1, price: 28500 },
    ],
  },
  {
    key: "Education", icon: "🎓",
    suppliers: [
      { name: "Metro School Supply Co.", type: "Distributor", location: "Sampaloc, Manila", region: "NCR" },
      { name: "Cebu Academic Depot", type: "Distributor", location: "Cebu City", region: "Central Visayas" },
    ],
    products: [
      { title: "School Chairs — Armchair Style (50 pcs)", unit: "bundle", moq: 2, price: 22500 },
      { title: "Textbook Supply Package (100 books, Elementary)", unit: "set", moq: 2, price: 18500 },
      { title: "Science Lab Supplies Kit (Beakers + Chemicals)", unit: "kit", moq: 5, price: 6500 },
      { title: "PE Sports Equipment Set (Balls + Cones)", unit: "kit", moq: 5, price: 4800 },
      { title: "Classroom Furniture Package (30 desks + teacher table)", unit: "set", moq: 1, price: 68500 },
      { title: "Educational AV Equipment (Projector + Screen)", unit: "set", moq: 2, price: 32500 },
      { title: "School Canteen Supply Starter Kit", unit: "kit", moq: 1, price: 22500 },
    ],
  },
  {
    key: "Healthcare Facilities", icon: "🏥", compliance: "Medical Docs Required",
    suppliers: [
      { name: "Metro Medical Facility Supply", type: "Distributor", location: "Quezon City", region: "NCR" },
      { name: "Davao Hospital Depot", type: "Distributor", location: "Davao City", region: "Davao Region" },
    ],
    products: [
      { title: "Hospital Bed (Manual, 2-Crank)", unit: "unit", moq: 2, price: 28500 },
      { title: "Diagnostic Supply Kit (Steth + BP + Thermometer)", unit: "kit", moq: 5, price: 3450 },
      { title: "Medical Oxygen Cylinder (10L)", unit: "cylinder", moq: 5, price: 4800, compliance: "Medical Docs Required" },
      { title: "Hospital Linen Supply (Scrubs + Sheets, 50 sets)", unit: "carton", moq: 2, price: 12500 },
      { title: "Clinical Consumables Pack (Syringes, Needles)", unit: "carton", moq: 5, price: 4800 },
      { title: "Hospital IT System Package (EMR Software)", unit: "license", moq: 1, price: 145000 },
      { title: "Autoclave Sterilizer (23L Benchtop)", unit: "unit", moq: 1, price: 65000 },
    ],
  },
  {
    key: "Beauty & Wellness", icon: "💅",
    suppliers: [
      { name: "Manila Salon Supply Co.", type: "Distributor", location: "Makati City", region: "NCR" },
      { name: "Cebu Spa & Beauty Wholesale", type: "Distributor", location: "Mandaue, Cebu", region: "Central Visayas" },
    ],
    products: [
      { title: "Hydraulic Salon Chair Package (4 chairs)", unit: "set", moq: 1, price: 48500 },
      { title: "Waxing & Threading Supplies Kit", unit: "kit", moq: 5, price: 3450 },
      { title: "Massage Oil Bulk (5L, Aromatherapy)", unit: "gallon", moq: 4, price: 2200 },
      { title: "Aesthetic Device Package (RF + Ultrasound)", unit: "set", moq: 1, price: 185000 },
      { title: "Spa Linen Set (Bathrobes + Towels, 20 sets)", unit: "carton", moq: 2, price: 12500 },
      { title: "Nail Salon Supply Kit (Gel + Tools + UV Lamp)", unit: "kit", moq: 3, price: 4800 },
      { title: "Hair Product Distributor Set (Professional Lines)", unit: "set", moq: 5, price: 6500 },
    ],
  },
  {
    key: "Fitness & Sports", icon: "🏋️",
    suppliers: [
      { name: "PH Gym Equipment Distribution", type: "Distributor", location: "Pasay City", region: "NCR", goldSupplier: true },
      { name: "Bacolod Sports Wholesale", type: "Distributor", location: "Bacolod City", region: "Western Visayas" },
    ],
    products: [
      { title: "Commercial Gym Equipment Package (5 machines)", unit: "set", moq: 1, price: 285000 },
      { title: "Sports Apparel Bulk (Dri-Fit Shirts, 100 pcs)", unit: "carton", moq: 2, price: 12500 },
      { title: "Whey Protein Wholesale (5lb tubs, 20 units)", unit: "carton", moq: 2, price: 32500 },
      { title: "Yoga & Pilates Equipment (Mats + Blocks, 30 sets)", unit: "carton", moq: 2, price: 8500 },
      { title: "Outdoor Sports Gear (Camping Package)", unit: "set", moq: 10, price: 3450 },
      { title: "Fitness Accessory Pack (Bands + Bottles + Towels)", unit: "carton", moq: 10, price: 1850 },
      { title: "Sports Nutrition Brand Supply (Bars + Powders)", unit: "carton", moq: 5, price: 6500 },
    ],
  },
  {
    key: "Logistics & Transport", icon: "🚚",
    suppliers: [
      { name: "Metro Logistics Supply", type: "Distributor", location: "Parañaque City", region: "NCR" },
      { name: "Subic Warehouse Solutions", type: "Distributor", location: "Subic, Zambales", region: "Central Luzon" },
    ],
    products: [
      { title: "Wooden Pallets (48x40, 50 pcs)", unit: "bundle", moq: 2, price: 12500 },
      { title: "Stretch Wrap Film (500mm x 300m, 6 rolls)", unit: "carton", moq: 5, price: 2200 },
      { title: "Warehouse Racks (Heavy Duty, 5-tier)", unit: "unit", moq: 5, price: 8500 },
      { title: "Fleet Diesel Fuel Supply (5000L)", unit: "job", moq: 1, price: 285000 },
      { title: "Truck Body Parts Kit (Assorted)", unit: "kit", moq: 5, price: 12500 },
      { title: "Vehicle Spare Parts Wholesale (10 SKUs)", unit: "carton", moq: 5, price: 8500 },
      { title: "Cold Chain Logistics Service (Monthly)", unit: "month", moq: 1, price: 68500 },
    ],
  },
  {
    key: "Agriculture Inputs", icon: "🌱", compliance: "FDA Docs Required",
    suppliers: [
      { name: "Davao Agriculture Inputs", type: "Distributor", location: "Davao City", region: "Davao Region" },
      { name: "Nueva Ecija Farm Depot", type: "Distributor", location: "Cabanatuan City", region: "Central Luzon" },
    ],
    products: [
      { title: "Fertilizer Sack (Urea 46-0-0, 50kg)", unit: "sack", moq: 20, price: 1650 },
      { title: "Pesticide Supply (Insecticide, 1L x 12)", unit: "carton", moq: 5, price: 3450, compliance: "Chemical Review Required" },
      { title: "Rice Seed Supply Pack (Certified, 20kg)", unit: "sack", moq: 10, price: 1450 },
      { title: "Animal Feed Sack (Broiler, 50kg)", unit: "sack", moq: 10, price: 1850 },
      { title: "Drip Irrigation Equipment Kit (1 hectare)", unit: "kit", moq: 1, price: 42500 },
      { title: "Farm Tools Package (Bolo, Shovel, Sprayer)", unit: "set", moq: 10, price: 1250 },
      { title: "Veterinary Supply Kit (Vaccines + Antibiotics)", unit: "kit", moq: 5, price: 4800, compliance: "Medical Docs Required" },
    ],
  },
  {
    key: "Real Estate & Property", icon: "🏢",
    suppliers: [
      { name: "BGC Interior Fit-Out Depot", type: "Distributor", location: "Taguig City", region: "NCR" },
      { name: "Cebu Property Supply Co.", type: "Distributor", location: "Cebu City", region: "Central Visayas" },
    ],
    products: [
      { title: "Interior Fit-Out Materials Kit (Studio Unit)", unit: "kit", moq: 1, price: 145000 },
      { title: "Flooring Supply (Vinyl Plank, 100 sqm)", unit: "job", moq: 1, price: 65000 },
      { title: "Door & Window Supply (10 sets, Aluminum)", unit: "set", moq: 1, price: 85000 },
      { title: "HVAC Split-Type Aircon (1.5HP Inverter, 10 units)", unit: "bundle", moq: 1, price: 285000 },
      { title: "Smart Home Devices Kit (Locks + Lights + Cams)", unit: "kit", moq: 5, price: 12500 },
      { title: "Security System Package (Alarm + CCTV)", unit: "set", moq: 1, price: 45000 },
      { title: "Landscaping Materials (Grass + Gravel + Plants)", unit: "job", moq: 1, price: 22500 },
    ],
  },
  {
    key: "Automotive & Transport", icon: "🚗",
    suppliers: [
      { name: "Cavite Auto Parts Supply", type: "Distributor", location: "Imus, Cavite", region: "CALABARZON" },
      { name: "Banawe Auto Wholesale", type: "Distributor", location: "Quezon City", region: "NCR", goldSupplier: true },
    ],
    products: [
      { title: "Engine Oil Drum (200L, 15W-40)", unit: "drum", moq: 2, price: 32500 },
      { title: "Truck Batteries (N120, 10 pcs)", unit: "bundle", moq: 1, price: 42500 },
      { title: "Passenger Tires (185/65R15, 20 pcs)", unit: "bundle", moq: 1, price: 48500 },
      { title: "Brake Pads Assortment (Front + Rear, 20 sets)", unit: "carton", moq: 3, price: 12500 },
      { title: "Car Care Product Kit (Wax + Wash + Polish)", unit: "kit", moq: 10, price: 1850 },
      { title: "Auto Parts Bulk Pack (Filters + Belts, 50 SKUs)", unit: "carton", moq: 2, price: 22500 },
      { title: "Detailing Product Distributor Pack", unit: "set", moq: 5, price: 6500 },
    ],
  },
  {
    key: "Marine & Fishing", icon: "🎣",
    suppliers: [
      { name: "Iloilo Marine Supply Co.", type: "Distributor", location: "Iloilo City", region: "Western Visayas" },
      { name: "Zamboanga Fishing Wholesale", type: "Distributor", location: "Zamboanga City", region: "Zamboanga Peninsula" },
    ],
    products: [
      { title: "Fishing Gear Supply (Nets + Lines + Hooks)", unit: "kit", moq: 5, price: 4800 },
      { title: "Aquaculture Water Treatment Chemicals (25kg)", unit: "pail", moq: 4, price: 3450, compliance: "Chemical Review Required" },
      { title: "Fish Feed Sack (Tilapia Grower, 25kg)", unit: "sack", moq: 20, price: 1250 },
      { title: "Insulated Cold Storage Boxes (100L, 10 pcs)", unit: "bundle", moq: 2, price: 18500 },
      { title: "Marine Safety Equipment (Life Vests + Buoys)", unit: "set", moq: 10, price: 3450 },
      { title: "Boat Repair Materials Kit (Fiberglass + Resin)", unit: "kit", moq: 3, price: 8500 },
      { title: "Fish Processing Equipment (Scaler + Filleter)", unit: "set", moq: 1, price: 32500 },
    ],
  },
];

// ---- Seed into exported arrays ----
(function seedCatalog() {
  let supIdx = 100;
  let prdIdx = 100;
  for (const ind of INDUSTRY_DEFS) {
    const supIds: string[] = [];
    for (const s of ind.suppliers) {
      supIdx++;
      const id = `sup_${supIdx}`;
      supIds.push(id);
      suppliers.push({
        id,
        name: s.name,
        type: s.type,
        location: s.location,
        region: s.region,
        verified: true,
        goldSupplier: !!s.goldSupplier,
        yearsOperating: 3 + ((supIdx * 7) % 18),
        rating: Math.round((4 + ((supIdx * 13) % 9) / 10) * 10) / 10,
        reviews: 40 + ((supIdx * 37) % 480),
        transactions: 120 + ((supIdx * 71) % 2800),
        repeatBuyers: 20 + ((supIdx * 19) % 320),
        responseTime: ["≤ 1 hr", "≤ 2 hrs", "≤ 4 hrs", "≤ 6 hrs"][supIdx % 4],
        leadTime: ["1–3 days", "2–5 days", "3–7 days", "Same day — NCR"][supIdx % 4],
        permits: ["DTI", "BIR", "Mayor's Permit"],
        description: `${s.name} — verified ${s.type.toLowerCase()} serving the ${ind.key} industry. KYC verified, escrow ready.`,
        cover: `https://picsum.photos/seed/${id}/1200/500`,
        categories: [ind.key],
      });
    }
    for (const p of ind.products) {
      prdIdx++;
      const id = `prd_${prdIdx}`;
      const supplierId = supIds[prdIdx % supIds.length];
      const restricted = !!p.restricted || !!ind.restricted;
      const compliance = p.compliance || ind.compliance;
      const price = p.price;
      const tiers = price > 0
        ? [
            { qty: p.moq, price },
            { qty: p.moq * 5, price: Math.round(price * 0.95) },
            { qty: p.moq * 20, price: Math.round(price * 0.88) },
          ]
        : [{ qty: p.moq, price: 0 }];
      products.push({
        id,
        supplierId,
        title: p.title,
        category: ind.key,
        industry: ind.key,
        unit: p.unit,
        moq: p.moq,
        pricePhp: price,
        tierPricing: tiers,
        leadTimeDays: 2 + (prdIdx % 6),
        image: `https://picsum.photos/seed/${id}/800/600`,
        stock: restricted ? "Compliance review required" : `In stock — ${100 + ((prdIdx * 31) % 4200)} ${p.unit}s`,
        description: `${p.title}. Sourced by a verified ${ind.key} supplier. Escrow-protected transaction. ${compliance ? "Compliance: " + compliance + "." : ""}`,
        origin: (ind.suppliers[prdIdx % ind.suppliers.length].location.split(",").pop() || "Philippines").trim(),
        tags: p.tags,
        restricted,
        compliance,
      });
    }
  }
})();

export const categories = INDUSTRY_DEFS.map((i) => ({ name: i.key, icon: i.icon }));

export const regions = [
  "NCR", "CALABARZON", "Central Luzon", "Central Visayas",
  "Davao Region", "Western Visayas", "Northern Mindanao",
  "Bicol Region", "Cordillera", "Zamboanga Peninsula",
];


export const supplierTypes = ["Manufacturer", "Distributor", "Farmer Co-op", "Importer"] as const;

export const formatPhp = (n: number) =>
  "₱" + n.toLocaleString("en-PH", { maximumFractionDigits: 0 });

export const supplierById = (id: string) => suppliers.find((s) => s.id === id)!;
export const productById = (id: string) => products.find((p) => p.id === id)!;
export const rfqById = (id: string) => rfqs.find((r) => r.id === id)!;
export const orderById = (id: string) => orders.find((o) => o.id === id)!;

export const escrowSteps: EscrowState[] = [
  "Awaiting Supplier Acceptance",
  "Funds Held in Escrow",
  "Preparing Shipment",
  "In Transit",
  "Delivered — Awaiting Confirmation",
  "Released to Supplier",
];

// Admin mock data
export const adminQueue = {
  pendingVerifications: [
    { id: "ver_1", business: "San Pablo Coconut Mills", type: "Manufacturer", submitted: "2 hrs ago", docs: ["DTI", "BIR", "Mayor's Permit"] },
    { id: "ver_2", business: "Iloilo Seafood Traders", type: "Distributor", submitted: "5 hrs ago", docs: ["SEC", "BIR", "BFAR"] },
    { id: "ver_3", business: "Baguio Strawberry Farmers", type: "Farmer Co-op", submitted: "Yesterday", docs: ["DA", "Mayor's Permit"] },
  ],
  openDisputes: [
    { id: "dsp_1", order: "ord_23944", buyer: "Sunrise Pharmacy", supplier: "Cebu Pharma Distribution", reason: "Short shipment — 12 boxes missing", amount: 1860, opened: "1 day ago" },
    { id: "dsp_2", order: "ord_23912", buyer: "Hotel Antonio", supplier: "QC Paper Mills", reason: "Damaged on arrival", amount: 3480, opened: "3 days ago" },
  ],
  flaggedAccounts: [
    { id: "flg_1", account: "BestPrice Wholesale", reason: "Multiple chargebacks", risk: "High" },
    { id: "flg_2", account: "Manila Quick Deals", reason: "Suspicious price patterns", risk: "Medium" },
  ],
};
