import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { PersonTagTable } from 'src/schema/tables/person-tag.table';

const SYSTEM_TAGS: Array<{ name: string; defaultHidden: boolean; color: string }> = [
  { name: 'Family', defaultHidden: false, color: '#3b82f6' },
  { name: 'Friends', defaultHidden: false, color: '#22c55e' },
  { name: 'Hidden', defaultHidden: true, color: '#9ca3af' },
];

@Injectable()
export class PersonTagRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getAllForOwner(userId: string) {
    return this.db
      .selectFrom('person_tag')
      .selectAll('person_tag')
      .select((eb) =>
        eb
          .selectFrom('person_to_tag')
          .select(sql<number>`coalesce(count(*), 0)::int`.as('peopleCount'))
          .whereRef('person_to_tag.tagId', '=', 'person_tag.id')
          .as('peopleCount'),
      )
      .where('person_tag.ownerId', '=', userId)
      .orderBy('person_tag.isSystem', 'desc')
      .orderBy('person_tag.parentTagId', (om) => om.asc().nullsFirst())
      .orderBy('person_tag.name', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  getById(userId: string, id: string) {
    return this.db
      .selectFrom('person_tag')
      .selectAll('person_tag')
      .select((eb) =>
        eb
          .selectFrom('person_to_tag')
          .select(sql<number>`coalesce(count(*), 0)::int`.as('peopleCount'))
          .whereRef('person_to_tag.tagId', '=', 'person_tag.id')
          .as('peopleCount'),
      )
      .where('person_tag.id', '=', id)
      .where('person_tag.ownerId', '=', userId)
      .executeTakeFirst();
  }

  create(tag: Insertable<PersonTagTable>) {
    return this.db.insertInto('person_tag').values(tag).returningAll().executeTakeFirstOrThrow();
  }

  async update(userId: string, id: string, dto: Updateable<PersonTagTable>) {
    return this.db
      .updateTable('person_tag')
      .set(dto)
      .where('id', '=', id)
      .where('ownerId', '=', userId)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(userId: string, id: string) {
    await this.db.deleteFrom('person_tag').where('id', '=', id).where('ownerId', '=', userId).execute();
  }

  async attachPeople(tagId: string, personIds: string[]) {
    if (personIds.length === 0) {
      return;
    }

    await this.db
      .insertInto('person_to_tag')
      .values(personIds.map((personId) => ({ tagId, personId })))
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  async detachPeople(tagId: string, personIds: string[]) {
    if (personIds.length === 0) {
      return;
    }

    await this.db
      .deleteFrom('person_to_tag')
      .where('tagId', '=', tagId)
      .where('personId', 'in', personIds)
      .execute();
  }

  async setTagsForPerson(personId: string, tagIds: string[]) {
    await this.db.transaction().execute(async (trx) => {
      await trx.deleteFrom('person_to_tag').where('personId', '=', personId).execute();
      if (tagIds.length > 0) {
        await trx
          .insertInto('person_to_tag')
          .values(tagIds.map((tagId) => ({ tagId, personId })))
          .onConflict((oc) => oc.doNothing())
          .execute();
      }
    });
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async getOwnedTagIds(userId: string, tagIds: string[]) {
    if (tagIds.length === 0) {
      return [] as { id: string }[];
    }
    return this.db
      .selectFrom('person_tag')
      .select(['id'])
      .where('ownerId', '=', userId)
      .where('id', 'in', tagIds)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async getOwnedPersonIds(userId: string, personIds: string[]) {
    if (personIds.length === 0) {
      return [] as { id: string }[];
    }
    return this.db
      .selectFrom('person')
      .select(['id'])
      .where('ownerId', '=', userId)
      .where('id', 'in', personIds)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async seedDefaultsForUser(userId: string) {
    for (const { name, defaultHidden, color } of SYSTEM_TAGS) {
      await this.db
        .insertInto('person_tag')
        .values({ ownerId: userId, name, defaultHidden, color, isSystem: true })
        .onConflict((oc) => oc.columns(['ownerId', 'parentTagId', 'name']).doNothing())
        .execute();
    }
  }
}
