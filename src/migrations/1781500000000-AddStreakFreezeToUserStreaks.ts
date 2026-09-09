import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStreakFreezeToUserStreaks1781500000000 implements MigrationInterface {
    name = 'AddStreakFreezeToUserStreaks1781500000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const freezeCountExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'user_streaks'
                AND column_name = 'freeze_count'
            );
        `);

        if (!freezeCountExists[0].exists) {
            await queryRunner.query(`
                ALTER TABLE user_streaks
                ADD COLUMN freeze_count INTEGER NOT NULL DEFAULT 0;
            `);
        }

        const frozenDateExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'user_streaks'
                AND column_name = 'frozen_date'
            );
        `);

        if (!frozenDateExists[0].exists) {
            await queryRunner.query(`
                ALTER TABLE user_streaks
                ADD COLUMN frozen_date DATE;
            `);
        }

        const lastFreezeMilestoneExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'user_streaks'
                AND column_name = 'last_freeze_milestone'
            );
        `);

        if (!lastFreezeMilestoneExists[0].exists) {
            await queryRunner.query(`
                ALTER TABLE user_streaks
                ADD COLUMN last_freeze_milestone INTEGER NOT NULL DEFAULT 0;
            `);
        }

        const checkConstraintExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.table_constraints
                WHERE constraint_name = 'chk_user_streaks_freeze_count'
                AND table_name = 'user_streaks'
            );
        `);

        if (!checkConstraintExists[0].exists) {
            await queryRunner.query(`
                ALTER TABLE user_streaks
                ADD CONSTRAINT chk_user_streaks_freeze_count CHECK (freeze_count >= 0 AND freeze_count <= 3);
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const checkConstraintExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.table_constraints
                WHERE constraint_name = 'chk_user_streaks_freeze_count'
                AND table_name = 'user_streaks'
            );
        `);

        if (checkConstraintExists[0].exists) {
            await queryRunner.query(`
                ALTER TABLE user_streaks
                DROP CONSTRAINT chk_user_streaks_freeze_count;
            `);
        }

        const lastFreezeMilestoneExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'user_streaks'
                AND column_name = 'last_freeze_milestone'
            );
        `);

        if (lastFreezeMilestoneExists[0].exists) {
            await queryRunner.query(`
                ALTER TABLE user_streaks
                DROP COLUMN last_freeze_milestone;
            `);
        }

        const frozenDateExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'user_streaks'
                AND column_name = 'frozen_date'
            );
        `);

        if (frozenDateExists[0].exists) {
            await queryRunner.query(`
                ALTER TABLE user_streaks
                DROP COLUMN frozen_date;
            `);
        }

        const freezeCountExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'user_streaks'
                AND column_name = 'freeze_count'
            );
        `);

        if (freezeCountExists[0].exists) {
            await queryRunner.query(`
                ALTER TABLE user_streaks
                DROP COLUMN freeze_count;
            `);
        }
    }
}
