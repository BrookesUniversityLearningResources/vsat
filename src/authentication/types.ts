export type User = {
  id?: number;
  name: string;
  email: string;
};

export type PersistentUser = Omit<User, "id"> & { id: number };

export function isUser(user: unknown): user is User {
  if (!user) {
    return false;
  }

  return typeof (user as User)?.email === "string";
}

export function isPersistentUser(user: unknown): user is PersistentUser {
  if (!user) {
    return false;
  }

  return (
    isUser(user) && typeof user.id === "number" && Number.isInteger(user.id)
  );
}
