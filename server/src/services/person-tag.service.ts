import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  mapPersonTag,
  PersonTagAttachDto,
  PersonTagCreateDto,
  PersonTagListResponseDto,
  PersonTagResponseDto,
  PersonTagsAssignDto,
  PersonTagUpdateDto,
} from 'src/dtos/person-tag.dto';
import { PersonTagRepository } from 'src/repositories/person-tag.repository';

@Injectable()
export class PersonTagService {
  constructor(private personTagRepository: PersonTagRepository) {}

  async getAll(auth: AuthDto): Promise<PersonTagListResponseDto> {
    const tags = await this.personTagRepository.getAllForOwner(auth.user.id);
    return { tags: tags.map((tag) => mapPersonTag(tag)) };
  }

  async getById(auth: AuthDto, id: string): Promise<PersonTagResponseDto> {
    const tag = await this.personTagRepository.getById(auth.user.id, id);
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    return mapPersonTag(tag);
  }

  async create(auth: AuthDto, dto: PersonTagCreateDto): Promise<PersonTagResponseDto> {
    if (dto.parentTagId) {
      const parent = await this.personTagRepository.getById(auth.user.id, dto.parentTagId);
      if (!parent) {
        throw new BadRequestException('Parent tag not found');
      }
      if (parent.parentTagId !== null) {
        throw new BadRequestException('Person tags only support one level of nesting');
      }
    }

    const tag = await this.personTagRepository.create({
      ownerId: auth.user.id,
      name: dto.name,
      parentTagId: dto.parentTagId ?? null,
      color: dto.color ?? null,
      defaultHidden: dto.defaultHidden ?? false,
      isSystem: false,
    });

    return mapPersonTag(tag);
  }

  async update(auth: AuthDto, id: string, dto: PersonTagUpdateDto): Promise<PersonTagResponseDto> {
    const existing = await this.personTagRepository.getById(auth.user.id, id);
    if (!existing) {
      throw new NotFoundException('Tag not found');
    }
    if (existing.isSystem && dto.name !== undefined && dto.name !== existing.name) {
      throw new ForbiddenException('System tags cannot be renamed');
    }

    const updated = await this.personTagRepository.update(auth.user.id, id, {
      name: dto.name,
      color: dto.color,
      defaultHidden: dto.defaultHidden,
    });

    if (!updated) {
      throw new NotFoundException('Tag not found');
    }
    return mapPersonTag(updated);
  }

  async remove(auth: AuthDto, id: string): Promise<void> {
    const existing = await this.personTagRepository.getById(auth.user.id, id);
    if (!existing) {
      throw new NotFoundException('Tag not found');
    }
    if (existing.isSystem) {
      throw new ForbiddenException('System tags cannot be deleted');
    }
    await this.personTagRepository.delete(auth.user.id, id);
  }

  async attachPeople(auth: AuthDto, tagId: string, dto: PersonTagAttachDto): Promise<void> {
    const tag = await this.personTagRepository.getById(auth.user.id, tagId);
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    const owned = await this.personTagRepository.getOwnedPersonIds(auth.user.id, dto.personIds);
    const ownedIds = owned.map((p) => p.id);
    if (ownedIds.length !== dto.personIds.length) {
      throw new ForbiddenException('One or more people are not owned by you');
    }
    await this.personTagRepository.attachPeople(tagId, ownedIds);
  }

  async detachPeople(auth: AuthDto, tagId: string, dto: PersonTagAttachDto): Promise<void> {
    const tag = await this.personTagRepository.getById(auth.user.id, tagId);
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    const owned = await this.personTagRepository.getOwnedPersonIds(auth.user.id, dto.personIds);
    const ownedIds = owned.map((p) => p.id);
    await this.personTagRepository.detachPeople(tagId, ownedIds);
  }

  async setTagsForPerson(auth: AuthDto, personId: string, dto: PersonTagsAssignDto): Promise<void> {
    const owned = await this.personTagRepository.getOwnedPersonIds(auth.user.id, [personId]);
    if (owned.length === 0) {
      throw new NotFoundException('Person not found');
    }
    const ownedTags = await this.personTagRepository.getOwnedTagIds(auth.user.id, dto.tagIds);
    if (ownedTags.length !== dto.tagIds.length) {
      throw new ForbiddenException('One or more tags are not owned by you');
    }
    await this.personTagRepository.setTagsForPerson(personId, ownedTags.map((t) => t.id));
  }
}
