import { Column, CreateDateColumn, ForeignKeyColumn, Generated, Index, Table, Timestamp } from '@immich/sql-tools';
import { PersonTable } from 'src/schema/tables/person.table';
import { PersonTagTable } from 'src/schema/tables/person-tag.table';

@Table('person_to_tag')
@Index({ columns: ['tagId'] })
export class PersonToTagTable {
  @ForeignKeyColumn(() => PersonTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  personId!: string;

  @ForeignKeyColumn(() => PersonTagTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true })
  tagId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
