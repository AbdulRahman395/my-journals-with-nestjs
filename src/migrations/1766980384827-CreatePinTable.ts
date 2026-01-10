import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreatePinTable1766980384827 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the pins table
    await queryRunner.createTable(
      new Table({
        name: 'pins',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'pin_hash',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'failed_attempts',
            type: 'integer',
            default: 0,
          },
          {
            name: 'locked_until',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Add index for faster lookups
    await queryRunner.createIndex(
      'pins',
      new TableIndex({
        name: 'idx_pins_user_id',
        columnNames: ['user_id'],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the pins table
    await queryRunner.dropTable('pins', true);
  }
}
