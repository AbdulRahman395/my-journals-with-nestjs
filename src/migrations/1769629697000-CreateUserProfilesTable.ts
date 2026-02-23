import type { MigrationInterface, QueryRunner } from 'typeorm';

export default class CreateUserProfilesTable1769629697000 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First check if users table exists and has UUID primary key
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableExists[0].exists) {
      throw new Error('Users table must exist before creating user_profiles table');
    }

    // Check the data type of users.id
    const columnInfo = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'id';
    `);

    if (columnInfo.length === 0) {
      throw new Error('Users table does not have an id column');
    }

    const idDataType = columnInfo[0].data_type;
    
    // Create user_profiles table with appropriate user_id type
    if (idDataType === 'uuid') {
      await queryRunner.query(`
        CREATE TABLE user_profiles (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          date_of_birth DATE,
          bio TEXT,
          profile_picture TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
      `);
    } else {
      // Fallback for integer id
      await queryRunner.query(`
        CREATE TABLE user_profiles (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          date_of_birth DATE,
          bio TEXT,
          profile_picture TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
      `);
    }

    // Create profiles for existing users with default values
    await queryRunner.query(`
      INSERT INTO user_profiles (user_id, first_name, last_name, bio)
      SELECT 
        id,
        'First Name',
        'Last Name',
        'Default bio for this user profile'
      FROM users
      WHERE id NOT IN (SELECT user_id FROM user_profiles);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS user_profiles;`);
  }
}
