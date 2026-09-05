export type TeamMemberRole =
  | "Sales Representative"
  | "Sales Manager"
  | "Finance Manager";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  joinedAt: string;
}
