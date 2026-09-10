import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStreakDayEventsTable1782000000000 implements MigrationInterface {
    name = 'CreateStreakDayEventsTable1782000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const tableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'streak_day_events'
            );
        `);

        if (!tableExists[0].exists) {
            await queryRunner.query(`
                CREATE TABLE streak_day_events (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    event_date DATE NOT NULL,
                    event_type VARCHAR(10) NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT chk_streak_day_events_type CHECK (event_type IN ('active', 'frozen')),
                    CONSTRAINT uq_streak_day_events_user_date UNIQUE (user_id, event_date)
                );
            `);
        }

        const indexExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM pg_indexes
                WHERE tablename = 'streak_day_events'
                AND indexname = 'idx_streak_day_events_user_date'
            );
        `);

        if (!indexExists[0].exists) {
            await queryRunner.query(`
                CREATE INDEX idx_streak_day_events_user_date ON streak_day_events (user_id, event_date);
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const indexExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM pg_indexes
                WHERE tablename = 'streak_day_events'
                AND indexname = 'idx_streak_day_events_user_date'
            );
        `);

        if (indexExists[0].exists) {
            await queryRunner.query(`
                DROP INDEX idx_streak_day_events_user_date;
            `);
        }

        const tableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'streak_day_events'
            );
        `);

        if (tableExists[0].exists) {
            await queryRunner.query(`
                DROP TABLE streak_day_events;
            `);
        }
    }
}
