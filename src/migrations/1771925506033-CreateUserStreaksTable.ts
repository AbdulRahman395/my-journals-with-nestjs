import { MigrationInterface, QueryRunner, Table, Index, Unique } from 'typeorm';

export class CreateUserStreaksTable1771925506033 implements MigrationInterface {
  name = 'CreateUserStreaksTable1771925506033';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table already exists
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_streaks'
      );
    `);

    if (!tableExists[0].exists) {
      // Create the user_streaks table
      await queryRunner.createTable(
        new Table({
          name: 'user_streaks',
          columns: [
            {
              name: 'id',
              type: 'integer',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'user_id',
              type: 'integer',
              isNullable: false,
            },
            {
              name: 'current_streak',
              type: 'integer',
              default: 0,
            },
            {
              name: 'longest_streak',
              type: 'integer',
              default: 0,
            },
            {
              name: 'last_activity_date',
              type: 'date',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp with time zone',
              default: 'NOW()',
            },
            {
              name: 'updated_at',
              type: 'timestamp with time zone',
              default: 'NOW()',
            },
          ],
        }),
        true,
      );

      // Add foreign key constraint if it doesn't exist
      const fkExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.table_constraints 
          WHERE constraint_name = 'fk_user_streaks_user_id'
          AND table_name = 'user_streaks'
        );
      `);

      if (!fkExists[0].exists) {
        await queryRunner.query(`
          ALTER TABLE user_streaks 
          ADD CONSTRAINT fk_user_streaks_user_id 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        `);
      }

      // Add unique constraint on user_id if it doesn't exist
      const uniqueExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.table_constraints 
          WHERE constraint_name = 'uq_user_streaks_user_id'
          AND table_name = 'user_streaks'
        );
      `);

      if (!uniqueExists[0].exists) {
        await queryRunner.query(`
          ALTER TABLE user_streaks 
          ADD CONSTRAINT uq_user_streaks_user_id UNIQUE (user_id)
        `);
      }

      // Add index on user_id if it doesn't exist
      const indexExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT FROM pg_indexes 
          WHERE tablename = 'user_streaks' 
          AND indexname = 'idx_user_streaks_user_id'
        );
      `);

      if (!indexExists[0].exists) {
        await queryRunner.query(`
          CREATE INDEX idx_user_streaks_user_id ON user_streaks(user_id)
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table if it exists
    await queryRunner.query(`DROP TABLE IF EXISTS user_streaks CASCADE`);
  }
}
