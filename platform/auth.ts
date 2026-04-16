export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export type AuthListener = (user: AuthUser | null) => void | Promise<void>;

export { subscribeAuth, signOut } from './auth.native';
