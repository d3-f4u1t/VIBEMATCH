export type AuthMode = "signup" | "login";

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  bio?: string;
  location_city?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  location_city: string | null;
  created_at: string;
};

export type UserProfileResponse = UserResponse & {
  date_of_birth: string | null;
  pronouns: string | null;
  gender: string | null;
  sexuality: string | null;
};

export type UserProfileUpdatePayload = {
  name?: string;
  bio?: string;
  location_city?: string;
  date_of_birth?: string;
  pronouns?: string;
  gender?: string;
  sexuality?: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  user: UserResponse;
};
