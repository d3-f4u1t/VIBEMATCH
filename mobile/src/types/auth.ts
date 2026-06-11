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

export type UserHabits = {
  smoking: string | null;
  drinking: string | null;
  weed: string | null;
};

export type UserProfileResponse = UserResponse & {
  date_of_birth: string | null;
  pronouns: string | null;
  gender: string | null;
  sexuality: string | null;
  ethnicity: string | null;
  height: string | null;
  z_sign: string | null;
  f_plan: string | null;
  pets: string | null;
  religion: string | null;
  habit: UserHabits | null;
};

export type UserProfileUpdatePayload = {
  name?: string;
  bio?: string;
  location_city?: string;
  date_of_birth?: string;
  pronouns?: string;
  gender?: string;
  sexuality?: string;
  ethnicity?: string;
  height?: string;
  z_sign?: string;
  f_plan?: string;
  pets?: string;
  religion?: string;
  habit?: Partial<UserHabits>;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  user: UserResponse;
};
