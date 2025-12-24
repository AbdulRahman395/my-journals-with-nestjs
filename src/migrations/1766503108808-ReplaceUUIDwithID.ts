import { MigrationInterface, QueryRunner } from "typeorm";

export class ReplaceUUIDwithID1766503108808 implements MigrationInterface {
    name = 'ReplaceUUIDwithID1766503108808';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "otps" DROP CONSTRAINT IF EXISTS "otps_user_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "journal_media" DROP CONSTRAINT IF EXISTS "journal_media_journal_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "journals" DROP CONSTRAINT IF EXISTS "journals_user_id_fkey"`);
        
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_otps_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_journal_media_journal_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_journals_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_journals_date"`);

        // 1. Add new integer ID columns
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "new_id" SERIAL`);
        await queryRunner.query(`ALTER TABLE "journals" ADD COLUMN "new_id" SERIAL`);
        await queryRunner.query(`ALTER TABLE "journals" ADD COLUMN "new_user_id" INTEGER`);
        await queryRunner.query(`ALTER TABLE "journal_media" ADD COLUMN "new_id" SERIAL`);
        await queryRunner.query(`ALTER TABLE "journal_media" ADD COLUMN "new_journal_id" INTEGER`);
        await queryRunner.query(`ALTER TABLE "otps" ADD COLUMN "new_id" SERIAL`);
        await queryRunner.query(`ALTER TABLE "otps" ADD COLUMN "new_user_id" INTEGER`);

        // 2. Update the new foreign key columns with the correct integer IDs
        // First, update the user_id in journals
        await queryRunner.query(`
            UPDATE journals j
            SET new_user_id = u.new_id
            FROM users u
            WHERE j.user_id::text = u.id::text
        `);

        // Then, update the journal_id in journal_media
        await queryRunner.query(`
            UPDATE journal_media jm
            SET new_journal_id = j.new_id
            FROM journals j
            WHERE jm.journal_id::text = j.id::text
        `);

        // Then, update the user_id in otps
        await queryRunner.query(`
            UPDATE otps o
            SET new_user_id = u.new_id
            FROM users u
            WHERE o.user_id::text = u.id::text
        `);

        // 3. Drop the old UUID columns
        await queryRunner.query(`ALTER TABLE "journals" DROP COLUMN IF EXISTS "id" CASCADE`);
        await queryRunner.query(`ALTER TABLE "journals" DROP COLUMN IF EXISTS "user_id"`);
        await queryRunner.query(`ALTER TABLE "journal_media" DROP COLUMN IF EXISTS "id" CASCADE`);
        await queryRunner.query(`ALTER TABLE "journal_media" DROP COLUMN IF EXISTS "journal_id"`);
        await queryRunner.query(`ALTER TABLE "otps" DROP COLUMN IF EXISTS "id" CASCADE`);
        await queryRunner.query(`ALTER TABLE "otps" DROP COLUMN IF EXISTS "user_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "id" CASCADE`);

        // 4. Rename the new columns to match the original names
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "new_id" TO "id"`);
        await queryRunner.query(`ALTER TABLE "journals" RENAME COLUMN "new_id" TO "id"`);
        await queryRunner.query(`ALTER TABLE "journals" RENAME COLUMN "new_user_id" TO "user_id"`);
        await queryRunner.query(`ALTER TABLE "journal_media" RENAME COLUMN "new_id" TO "id"`);
        await queryRunner.query(`ALTER TABLE "journal_media" RENAME COLUMN "new_journal_id" TO "journal_id"`);
        await queryRunner.query(`ALTER TABLE "otps" RENAME COLUMN "new_id" TO "id"`);
        await queryRunner.query(`ALTER TABLE "otps" RENAME COLUMN "new_user_id" TO "user_id"`);

        // 5. Set primary keys
        await queryRunner.query(`ALTER TABLE "users" ADD PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "journals" ADD PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "journal_media" ADD PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "otps" ADD PRIMARY KEY ("id")`);

        // 6. Recreate indexes
        await queryRunner.query(`CREATE INDEX "idx_journals_date" ON "journals" ("journal_date")`);
        await queryRunner.query(`CREATE INDEX "idx_journals_user_id" ON "journals" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "idx_journal_media_journal_id" ON "journal_media" ("journal_id")`);
        await queryRunner.query(`CREATE INDEX "idx_otps_user_id" ON "otps" ("user_id")`);

        // 7. Recreate foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "journals" 
            ADD CONSTRAINT "journals_user_id_fkey" 
            FOREIGN KEY ("user_id") 
            REFERENCES "users"("id") 
            ON DELETE NO ACTION 
            ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "journal_media" 
            ADD CONSTRAINT "journal_media_journal_id_fkey" 
            FOREIGN KEY ("journal_id") 
            REFERENCES "journals"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "otps" 
            ADD CONSTRAINT "otps_user_id_fkey" 
            FOREIGN KEY ("user_id") 
            REFERENCES "users"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // This is a complex migration that changes primary key types
        // A proper rollback would require similar steps to restore UUIDs
        // For simplicity, we'll just throw an error since this is a one-way migration
        throw new Error('This migration cannot be rolled back automatically. Please restore from backup if needed.');
    }
}
