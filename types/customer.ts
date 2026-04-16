export interface CustomerProfile {
  uid: string;
  name: string;
  email: string;
  photoUrl: string;
  phone: string | null;
  createdAt: number;
}
