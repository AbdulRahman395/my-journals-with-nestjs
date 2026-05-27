import { MigrationInterface, QueryRunner } from "typeorm";

export class FixAllTablesIdSequences1779877024745 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Fix users table
        await queryRunner.query(`
            CREATE SEQUENCE IF NOT EXISTS users_id_seq START WITH 1 INCREMENT BY 1;
            ALTER TABLE users ALTER COLUMN id SET DEFAULT nextval('users_id_seq');
            SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
        `);

        // Fix otps table
        await queryRunner.query(`
            CREATE SEQUENCE IF NOT EXISTS otps_id_seq START WITH 1 INCREMENT BY 1;
            ALTER TABLE otps ALTER COLUMN id SET DEFAULT nextval('otps_id_seq');
            SELECT setval('otps_id_seq', COALESCE((SELECT MAX(id) FROM otps), 1));
        `);

        // Fix user_profiles table
        await queryRunner.query(`
            CREATE SEQUENCE IF NOT EXISTS user_profiles_id_seq START WITH 1 INCREMENT BY 1;
            ALTER TABLE user_profiles ALTER COLUMN id SET DEFAULT nextval('user_profiles_id_seq');
            SELECT setval('user_profiles_id_seq', COALESCE((SELECT MAX(id) FROM user_profiles), 1));
        `);

        // Fix journals table
        await queryRunner.query(`
            CREATE SEQUENCE IF NOT EXISTS journals_id_seq START WITH 1 INCREMENT BY 1;
            ALTER TABLE journals ALTER COLUMN id SET DEFAULT nextval('journals_id_seq');
            SELECT setval('journals_id_seq', COALESCE((SELECT MAX(id) FROM journals), 1));
        `);

        // Fix journal_media table
        await queryRunner.query(`
            CREATE SEQUENCE IF NOT EXISTS journal_media_id_seq START WITH 1 INCREMENT BY 1;
            ALTER TABLE journal_media ALTER COLUMN id SET DEFAULT nextval('journal_media_id_seq');
            SELECT setval('journal_media_id_seq', COALESCE((SELECT MAX(id) FROM journal_media), 1));
        `);

        // Fix pins table
        await queryRunner.query(`
            CREATE SEQUENCE IF NOT EXISTS pins_id_seq START WITH 1 INCREMENT BY 1;
            ALTER TABLE pins ALTER COLUMN id SET DEFAULT nextval('pins_id_seq');
            SELECT setval('pins_id_seq', COALESCE((SELECT MAX(id) FROM pins), 1));
        `);

        // Fix locks table
        await queryRunner.query(`
            CREATE SEQUENCE IF NOT EXISTS locks_id_seq START WITH 1 INCREMENT BY 1;
            ALTER TABLE locks ALTER COLUMN id SET DEFAULT nextval('locks_id_seq');
            SELECT setval('locks_id_seq', COALESCE((SELECT MAX(id) FROM locks), 1));
        `);

        // Fix user_streaks table
        await queryRunner.query(`
            CREATE SEQUENCE IF NOT EXISTS user_streaks_id_seq START WITH 1 INCREMENT BY 1;
            ALTER TABLE user_streaks ALTER COLUMN id SET DEFAULT nextval('user_streaks_id_seq');
            SELECT setval('user_streaks_id_seq', COALESCE((SELECT MAX(id) FROM user_streaks), 1));
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE users ALTER COLUMN id DROP DEFAULT;`);
        await queryRunner.query(`ALTER TABLE otps ALTER COLUMN id DROP DEFAULT;`);
        await queryRunner.query(`ALTER TABLE user_profiles ALTER COLUMN id DROP DEFAULT;`);
        await queryRunner.query(`ALTER TABLE journals ALTER COLUMN id DROP DEFAULT;`);
        await queryRunner.query(`ALTER TABLE journal_media ALTER COLUMN id DROP DEFAULT;`);
        await queryRunner.query(`ALTER TABLE pins ALTER COLUMN id DROP DEFAULT;`);
        await queryRunner.query(`ALTER TABLE locks ALTER COLUMN id DROP DEFAULT;`);
        await queryRunner.query(`ALTER TABLE user_streaks ALTER COLUMN id DROP DEFAULT;`);
    }
}