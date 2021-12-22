export interface User extends Document {
  login: string;
  password: string;
  email: string;
  mask: Array<string>;
  rating: number;
  token: string;
}
