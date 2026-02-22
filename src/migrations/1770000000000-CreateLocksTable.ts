import type { MigrationInterface, QueryRunner } from 'typeorm';

export default class CreateLocksTable1770000000000 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE lock_preferences_enum AS ENUM (
        'immediately',
        '1 min',
        '5 min',
        '10 min',
        '30 min',
        'off'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE locks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        preferences lock_preferences_enum NOT NULL DEFAULT 'immediately',
        last_active TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_locks_user_id ON locks(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS locks;`);
    await queryRunner.query(`DROP TYPE IF EXISTS lock_preferences_enum;`);
  }
}
