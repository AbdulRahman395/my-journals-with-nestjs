import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateUserSchema1770100000000 implements MigrationInterface {
    name = 'UpdateUserSchema1770100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remove name column from users table if it exists
        const usersTable = await queryRunner.getTable('users');
        if (usersTable) {
            const nameColumn = usersTable.findColumnByName('name');
            if (nameColumn) {
                await queryRunner.dropColumn('users', 'name');
            }
        }

        // Add full_name column to user_profiles table if it doesn't exist
        const userProfilesTable = await queryRunner.getTable('user_profiles');
        if (userProfilesTable) {
            const fullNameColumn = userProfilesTable.findColumnByName('full_name');
            if (!fullNameColumn) {
                await queryRunner.addColumn(
                    'user_profiles',
                    new TableColumn({
                        name: 'full_name',
                        type: 'varchar',
                        length: '511',
                        isNullable: true,
                    })
                );
            }

            // Remove first_name column if it exists
            const firstNameColumn = userProfilesTable.findColumnByName('first_name');
            if (firstNameColumn) {
                await queryRunner.dropColumn('user_profiles', 'first_name');
            }

            // Remove last_name column if it exists
            const lastNameColumn = userProfilesTable.findColumnByName('last_name');
            if (lastNameColumn) {
                await queryRunner.dropColumn('user_profiles', 'last_name');
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add back name column to users table if it doesn't exist
        const usersTable = await queryRunner.getTable('users');
        if (usersTable) {
            const nameColumn = usersTable.findColumnByName('name');
            if (!nameColumn) {
                await queryRunner.addColumn(
                    'users',
                    new TableColumn({
                        name: 'name',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    })
                );
            }
        }

        // Add back first_name and last_name columns to user_profiles table if they don't exist
        const userProfilesTable = await queryRunner.getTable('user_profiles');
        if (userProfilesTable) {
            const firstNameColumn = userProfilesTable.findColumnByName('first_name');
            if (!firstNameColumn) {
                await queryRunner.addColumn(
                    'user_profiles',
                    new TableColumn({
                        name: 'first_name',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    })
                );
            }

            const lastNameColumn = userProfilesTable.findColumnByName('last_name');
            if (!lastNameColumn) {
                await queryRunner.addColumn(
                    'user_profiles',
                    new TableColumn({
                        name: 'last_name',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    })
                );
            }

            // Remove full_name column if it exists
            const fullNameColumn = userProfilesTable.findColumnByName('full_name');
            if (fullNameColumn) {
                await queryRunner.dropColumn('user_profiles', 'full_name');
            }
        }
    }
}
