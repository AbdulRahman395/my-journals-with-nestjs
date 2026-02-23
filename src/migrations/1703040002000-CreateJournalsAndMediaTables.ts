import type { MigrationInterface, QueryRunner } from 'typeorm';

export default class CreateJournalsAndMediaTables1703040002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create journals table
    await queryRunner.query(`
      CREATE TABLE journals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT,
        content TEXT,
        journal_date DATE NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Create journal_media table
    await queryRunner.query(`
      CREATE TABLE journal_media (
        id SERIAL PRIMARY KEY,
        journal_id INTEGER NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Create indexes
    await queryRunner.query('CREATE INDEX idx_journals_user_id ON journals(user_id)');
    await queryRunner.query('CREATE INDEX idx_journals_date ON journals(journal_date)');
    await queryRunner.query('CREATE INDEX idx_journal_media_journal_id ON journal_media(journal_id)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query('DROP INDEX IF EXISTS idx_journal_media_journal_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_journals_date');
    await queryRunner.query('DROP INDEX IF EXISTS idx_journals_user_id');
    
    // Drop tables in reverse order
    await queryRunner.query('DROP TABLE IF EXISTS journal_media');
    await queryRunner.query('DROP TABLE IF EXISTS journals');
  }
}
