export class ProfileResponseDto {
  id: number;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: Date | null;
  bio: string | null;
  profile_picture: string | null;
  created_at: Date;
  updated_at: Date;
}
