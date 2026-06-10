import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTimezoneToUserProfile1780838129977 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const columnExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'user_profiles'
                AND column_name = 'timezone'
            );
        `);

        if (!columnExists[0].exists) {
            await queryRunner.query(`
                ALTER TABLE user_profiles
                ADD COLUMN timezone VARCHAR(100) NOT NULL DEFAULT 'UTC';
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const columnExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'user_profiles'
                AND column_name = 'timezone'
            );
        `);

        if (columnExists[0].exists) {
            await queryRunner.query(`
                ALTER TABLE user_profiles
                DROP COLUMN timezone;
            `);
        }
    }
}
