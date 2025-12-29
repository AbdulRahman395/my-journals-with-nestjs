import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeTitleAndContentFieldsTypes1766980384826 implements MigrationInterface {
    name = 'ChangeTitleAndContentFieldsTypes1766980384826';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, create new jsonb columns with temporary names
        await queryRunner.query(`ALTER TABLE "journals" ADD COLUMN "temp_title" jsonb`);
        await queryRunner.query(`ALTER TABLE "journals" ADD COLUMN "temp_content" jsonb`);

        // Convert existing string data to jsonb format
        // For non-null values, create a jsonb object with the text content
        await queryRunner.query(`
            UPDATE "journals" 
            SET 
                "temp_title" = CASE 
                    WHEN "title" IS NOT NULL THEN jsonb_build_object('text', "title")
                    ELSE NULL 
                END,
                "temp_content" = CASE 
                    WHEN "content" IS NOT NULL THEN jsonb_build_object('text', "content")
                    ELSE NULL 
                END
        `);

        // Drop the old columns
        await queryRunner.query(`ALTER TABLE "journals" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "journals" DROP COLUMN "content"`);

        // Rename the temporary columns to the original names
        await queryRunner.query(`ALTER TABLE "journals" RENAME COLUMN "temp_title" TO "title"`);
        await queryRunner.query(`ALTER TABLE "journals" RENAME COLUMN "temp_content" TO "content"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Create temporary text columns
        await queryRunner.query(`ALTER TABLE "journals" ADD COLUMN "temp_title" text`);
        await queryRunner.query(`ALTER TABLE "journals" ADD COLUMN "temp_content" text`);

        // Convert jsonb back to text by extracting the 'text' field
        await queryRunner.query(`
            UPDATE "journals" 
            SET 
                "temp_title" = "title"->>'text',
                "temp_content" = "content"->>'text'
        `);

        // Drop the jsonb columns
        await queryRunner.query(`ALTER TABLE "journals" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "journals" DROP COLUMN "content"`);

        // Rename the temporary columns back to original names with text type
        await queryRunner.query(`ALTER TABLE "journals" RENAME COLUMN "temp_title" TO "title"`);
        await queryRunner.query(`ALTER TABLE "journals" RENAME COLUMN "temp_content" TO "content"`);
    }
}