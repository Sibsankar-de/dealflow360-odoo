export interface DiscountTiers {
  goldPercent: number;
  silverPercent: number;
  bronzePercent: number;
}

export interface StoreAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CompanySettings {
  storeName: string;
  currency: string;
  currencySymbol: string;
  address: StoreAddress;
  discountTiers: DiscountTiers;
}
