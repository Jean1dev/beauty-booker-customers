export interface ProfessionalTheme {
  accent: string;
  primary: string;
}

export interface Professional {
  id: string;
  userLink: string;
  logoUrl?: string;
  name?: string;
  displayName?: string;
  serviceCategory?: string;
  isPublicProfile?: boolean;
  theme?: ProfessionalTheme;
}

export interface CustomerFavorite {
  customerId: string;
  userLink: string;
  createdAt: number;
}
