export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  birthDate?: string;
  pushToken?: string;
  token?: string;
};