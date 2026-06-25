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
  unit: string;
  moq: number;
  pricePhp: number;
  tierPricing: { qty: number; price: number }[];
  leadTimeDays: number;
  image: string;
  stock: string;
  description: string;
  origin: string;
};

export type RFQ = {
  id: string;
  buyer: string;
  buyerType: string;
  title: string;
  category: string;
  qty: string;
  budgetPhp: string;
  deliverBy: string;
  region: string;
  postedAgo: string;
  description: string;
  responses: number;
  status: "Open" | "Awarded" | "Closed";
  quotes: {
    supplierId: string;
    pricePhp: number;
    moq: number;
    leadTimeDays: number;
    note: string;
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
    buyer: "Lola Nena's Carinderia Group", buyerType: "Carinderia (8 branches)",
    title: "500 kg/month premium rice — recurring",
    category: "Rice & Grains",
    qty: "500 kg / month (recurring 6 months)",
    budgetPhp: "₱45–50 / kg",
    deliverBy: "Weekly drops, Mon",
    region: "Metro Manila",
    postedAgo: "2 hrs ago",
    description:
      "We operate 8 branches in QC and Caloocan. Need consistent quality, weekly delivery to a central commissary in Project 8. Open to 6-month contract.",
    responses: 4,
    status: "Open",
    quotes: [
      { supplierId: "sup_001", pricePhp: 46, moq: 200, leadTimeDays: 2, note: "Locked-in pricing for 6 months. Weekly delivery, free for orders ≥ 300 kg." },
      { supplierId: "sup_003", pricePhp: 48, moq: 100, leadTimeDays: 3, note: "Can mix grades on request. Delivery via partner trucker." },
    ],
  },
  {
    id: "rfq_002",
    buyer: "Casa Marikina Boutique Hotel", buyerType: "Hotel — 64 rooms",
    title: "Toiletries + tissue starter pack for 64 rooms",
    category: "Paper",
    qty: "Setup pack + monthly resupply",
    budgetPhp: "Open",
    deliverBy: "Within 2 weeks",
    region: "Metro Manila",
    postedAgo: "1 day ago",
    description: "Looking for a hotel toiletries supplier. Want kraft-look packaging, eco-positioned. Monthly resupply schedule.",
    responses: 6,
    status: "Open",
    quotes: [
      { supplierId: "sup_008", pricePhp: 0, moq: 0, leadTimeDays: 5, note: "We can do a custom kraft line. Sending sample pack at no cost." },
    ],
  },
  {
    id: "rfq_003",
    buyer: "BarakoBros Coffee", buyerType: "Café chain (12 outlets)",
    title: "House blend espresso — 80 kg / month",
    category: "Coffee",
    qty: "80 kg / month",
    budgetPhp: "≤ ₱700 / kg",
    deliverBy: "First delivery in 10 days",
    region: "Metro Manila + Cavite",
    postedAgo: "3 days ago",
    description: "Switching roaster. Want chocolatey medium-dark profile. Will cup-test 3 samples.",
    responses: 9,
    status: "Open",
    quotes: [
      { supplierId: "sup_004", pricePhp: 680, moq: 25, leadTimeDays: 3, note: "Will send 3 sample profiles by Friday. Free cupping at our roastery." },
    ],
  },
  {
    id: "rfq_004",
    buyer: "Mercury Aid Pharmacy", buyerType: "Pharmacy — 3 branches",
    title: "OTC analgesics — quarterly restock",
    category: "Pharma",
    qty: "2,000 boxes paracetamol + ibuprofen mix",
    budgetPhp: "Best price",
    deliverBy: "End of month",
    region: "Metro Manila",
    postedAgo: "5 days ago",
    description: "Must be FDA-registered, ≥ 18 months shelf life. Will need certificate of analysis.",
    responses: 3,
    status: "Awarded",
    quotes: [
      { supplierId: "sup_005", pricePhp: 152, moq: 200, leadTimeDays: 4, note: "Awarded — 24-month shelf life batches available." },
    ],
  },
  {
    id: "rfq_005",
    buyer: "Vista Builders Inc.", buyerType: "Contractor",
    title: "Portland cement — 4,000 bags for site",
    category: "Construction",
    qty: "4,000 bags (40 kg)",
    budgetPhp: "≤ ₱280 / bag",
    deliverBy: "Phased over 3 weeks",
    region: "Cavite",
    postedAgo: "1 week ago",
    description: "Project site in Dasmariñas. Need phased delivery and project pricing.",
    responses: 5,
    status: "Open",
    quotes: [
      { supplierId: "sup_006", pricePhp: 268, moq: 500, leadTimeDays: 5, note: "Phased delivery available. Project terms with PSG escrow per tranche." },
    ],
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

export const categories = [
  { name: "Rice & Grains", icon: "🌾" },
  { name: "Seafood", icon: "🐟" },
  { name: "Vegetables", icon: "🥬" },
  { name: "Coffee", icon: "☕" },
  { name: "Beverages", icon: "🥤" },
  { name: "Pharma", icon: "💊" },
  { name: "Construction", icon: "🧱" },
  { name: "Packaging", icon: "📦" },
  { name: "Paper", icon: "🧻" },
  { name: "Flour", icon: "🥖" },
  { name: "Medical Supplies", icon: "🩺" },
  { name: "Disposables", icon: "🍱" },
];

export const regions = ["NCR", "CALABARZON", "Central Luzon", "Central Visayas", "Davao Region"];

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
