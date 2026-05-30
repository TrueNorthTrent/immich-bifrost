import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  Unique,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { UserTable } from 'src/schema/tables/user.table';

@Table('person_tag')
@UpdatedAtTrigger('person_tag_updatedAt')
// NULLS NOT DISTINCT applied directly in the migration so that top-level tags
// (parentTagId NULL) are still constrained by (ownerId, name).
@Unique({ columns: ['ownerId', 'parentTagId', 'name'] })
export class PersonTagTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => UserTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  ownerId!: string;

  @Column()
  name!: string;

  @ForeignKeyColumn(() => PersonTagTable, { onDelete: 'CASCADE', nullable: true })
  parentTagId!: string | null;

  @Column({ type: 'boolean', default: false })
  defaultHidden!: Generated<boolean>;

  @Column({ type: 'character varying', nullable: true, default: null })
  color!: string | null;

  // Seeded "Family" / "Friends" / "Hidden" tags are flagged so the UI can prevent rename/delete.
  @Column({ type: 'boolean', default: false })
  isSystem!: Generated<boolean>;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
