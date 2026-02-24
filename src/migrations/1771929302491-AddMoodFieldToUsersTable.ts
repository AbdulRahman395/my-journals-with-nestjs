import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMoodFieldToUsersTable1771929302491 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the mood enum type if it doesn't exist
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mood_enum') THEN
          CREATE TYPE mood_enum AS ENUM ('Happy', 'Calm', 'Neutral', 'Sad');
        END IF;
      END $$;
    `);

    // Add the mood column to journals table if it doesn't exist
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'journals' 
          AND column_name = 'mood'
        ) THEN
          ALTER TABLE journals ADD COLUMN mood mood_enum NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the mood column from journals table if it exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'journals' 
          AND column_name = 'mood'
        ) THEN
          ALTER TABLE journals DROP COLUMN mood;
        END IF;
      END $$;
    `);

    // Drop the mood enum type if it exists and is not being used by any other tables
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mood_enum') THEN
          -- Check if the enum is being used by any table
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE data_type = 'USER-DEFINED' 
            AND udt_name = 'mood_enum'
          ) THEN
            DROP TYPE mood_enum;
          END IF;
        END IF;
      END $$;
    `);
  }
}