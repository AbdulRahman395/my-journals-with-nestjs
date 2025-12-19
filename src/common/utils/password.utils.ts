import * as bcrypt from 'bcrypt';

export class PasswordUtils {
  private static readonly SALT_ROUNDS = 10;

  // ========================= Hash password =========================
  static async hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.SALT_ROUNDS);
  }

  // ========================= Compare password =========================
  static async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
