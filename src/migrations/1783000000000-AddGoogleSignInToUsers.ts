import { MigrationInterface, QueryRunner } from "typeorm";

// Google sign-in: users can now have no password, and get a unique google_id once linked to Google.
// The constraint name is the one TypeORM generates for users.google_id, so synchronize sees no difference.
export class AddGoogleSignInToUsers1783000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'UQ_0bd5012aeb82628e07f6a1be53b'
                ) THEN
                    ALTER TABLE users
                    ADD CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b" UNIQUE (google_id);
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            ALTER TABLE users
            ALTER COLUMN password_hash DROP NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Google-only users get a placeholder that no password can match, instead of being deleted
        await queryRunner.query(`
            UPDATE users SET password_hash = '!google-only' WHERE password_hash IS NULL;
        `);

        await queryRunner.query(`
            ALTER TABLE users
            ALTER COLUMN password_hash SET NOT NULL;
        `);

        await queryRunner.query(`
            ALTER TABLE users
            DROP CONSTRAINT IF EXISTS "UQ_0bd5012aeb82628e07f6a1be53b";
        `);

        await queryRunner.query(`
            ALTER TABLE users
            DROP COLUMN IF EXISTS google_id;
        `);
    }
}
