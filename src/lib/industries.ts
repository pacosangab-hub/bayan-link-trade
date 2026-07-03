// 30 PSG B2B industries per the industry matrix.
export type Industry = {
  name: string;
  icon: string;
  sellers: string;
  buyers: string;
};

export const industries: Industry[] = [
  { name: "Food Manufacturing & FMCG", icon: "🥫", sellers: "Factories, packers", buyers: "Groceries, carinderias, hotels" },
  { name: "Agriculture & Fresh Produce", icon: "🌾", sellers: "Farmers, coops", buyers: "Restaurants, wet markets, hotels" },
  { name: "Beverages", icon: "🥤", sellers: "Bottlers, roasters", buyers: "Cafés, bars, hotels, offices" },
  { name: "Bakery & Confectionery", icon: "🥖", sellers: "Bakeries, ingredient importers", buyers: "Cafés, hotels, resellers" },
  { name: "Pharmaceutical & Health", icon: "💊", sellers: "Distributors, wholesalers", buyers: "Pharmacies, clinics, hospitals" },
  { name: "Personal Care & Cosmetics", icon: "🧴", sellers: "Contract manufacturers", buyers: "Salons, resellers, retailers" },
  { name: "Cleaning & Hygiene", icon: "🧼", sellers: "Chem manufacturers", buyers: "Hotels, offices, schools" },
  { name: "Construction Materials", icon: "🧱", sellers: "Cement, steel, tile suppliers", buyers: "Contractors, developers" },
  { name: "Industrial Equipment", icon: "⚙️", sellers: "Machine dealers", buyers: "Factories, workshops" },
  { name: "Chemicals & Raw Materials", icon: "⚗️", sellers: "Chem importers", buyers: "Manufacturers" },
  { name: "Packaging Materials", icon: "📦", sellers: "Box, plastic, label makers", buyers: "F&B, e-commerce sellers" },
  { name: "Textile & Garments", icon: "🧵", sellers: "Textile mills, factories", buyers: "Uniform makers, resellers" },
  { name: "Mining & Energy", icon: "⛏️", sellers: "Aggregate, fuel suppliers", buyers: "Contractors, factories" },
  { name: "IT & Telecommunications", icon: "🖧", sellers: "Hardware, ISP resellers", buyers: "Offices, BPOs, schools" },
  { name: "Financial Services Support", icon: "🏦", sellers: "POS, insurance, fintech", buyers: "SMEs, retailers" },
  { name: "Automotive & Parts", icon: "🚗", sellers: "Parts distributors", buyers: "Garages, fleets" },
  { name: "Logistics & Freight", icon: "🚚", sellers: "Truckers, forwarders", buyers: "All sellers" },
  { name: "Office Supplies", icon: "🖨️", sellers: "Stationery, IT resellers", buyers: "Offices, schools" },
  { name: "Restaurant & Kitchen Equipment", icon: "🍳", sellers: "Kitchen dealers", buyers: "Restaurants, hotels" },
  { name: "Hotel & Hospitality Supplies", icon: "🏨", sellers: "Linen, amenities", buyers: "Hotels, resorts" },
  { name: "Medical Supplies & Devices", icon: "🩺", sellers: "Med device importers", buyers: "Clinics, hospitals" },
  { name: "Agri Inputs & Feeds", icon: "🌱", sellers: "Feed mills, fertilizer", buyers: "Farmers, coops" },
  { name: "Livestock & Poultry", icon: "🐔", sellers: "Farms, integrators", buyers: "Restaurants, groceries" },
  { name: "Seafood & Aquaculture", icon: "🐟", sellers: "Fisherfolk coops", buyers: "Restaurants, hotels, exporters" },
  { name: "Electronics & Appliances", icon: "📺", sellers: "Distributors", buyers: "Retailers, offices" },
  { name: "Print & Signage", icon: "🖨️", sellers: "Print shops", buyers: "Retailers, brands" },
  { name: "Safety & PPE", icon: "🦺", sellers: "Safety gear suppliers", buyers: "Contractors, factories" },
  { name: "Solar & Renewable", icon: "☀️", sellers: "Panel, battery dealers", buyers: "Developers, homeowners" },
  { name: "Education Supplies", icon: "🎓", sellers: "Textbook, uniform makers", buyers: "Schools, universities" },
  { name: "Events & Promotions", icon: "🎪", sellers: "Rental, giveaway makers", buyers: "Corporates, marketers" },
];
