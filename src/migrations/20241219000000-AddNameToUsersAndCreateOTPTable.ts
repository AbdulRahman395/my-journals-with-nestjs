import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNameToUsersAndCreateOTPTable20241219000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add name column to users table
    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT '';
    `);

    // Create otps table
    await queryRunner.query(`
      CREATE TABLE otps (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        otp VARCHAR(6) NOT NULL,
        is_used BOOLEAN NOT NULL DEFAULT FALSE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create index for faster lookups
    await queryRunner.query(`
      CREATE INDEX idx_otps_user_id ON otps(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_otps_user_id;`);
    await queryRunner.query(`DROP TABLE IF EXISTS otps;`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS name;`);
  }
}