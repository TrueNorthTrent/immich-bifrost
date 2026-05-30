import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  PersonTagAttachDto,
  PersonTagCreateDto,
  PersonTagListResponseDto,
  PersonTagResponseDto,
  PersonTagsAssignDto,
  PersonTagUpdateDto,
} from 'src/dtos/person-tag.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { PersonTagService } from 'src/services/person-tag.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.PersonTags)
@Controller('person-tags')
export class PersonTagController {
  constructor(private service: PersonTagService) {}

  @Get()
  @Authenticated({ permission: Permission.PersonRead })
  @Endpoint({
    summary: 'List person tags',
    description: 'Retrieve all person tags owned by the current user.',
    history: new HistoryBuilder().added('v1.150.0').stable('v2'),
  })
  getAllPersonTags(@Auth() auth: AuthDto): Promise<PersonTagListResponseDto> {
    return this.service.getAll(auth);
  }

  @Post()
  @Authenticated({ permission: Permission.PersonCreate })
  @Endpoint({
    summary: 'Create a person tag',
    description: 'Create a new top-level or nested person tag.',
    history: new HistoryBuilder().added('v1.150.0').stable('v2'),
  })
  createPersonTag(@Auth() auth: AuthDto, @Body() dto: PersonTagCreateDto): Promise<PersonTagResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.PersonRead })
  @Endpoint({
    summary: 'Get a person tag',
    description: 'Retrieve a single person tag by id.',
    history: new HistoryBuilder().added('v1.150.0').stable('v2'),
  })
  getPersonTagById(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<PersonTagResponseDto> {
    return this.service.getById(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.PersonUpdate })
  @Endpoint({
    summary: 'Update a person tag',
    description: 'Update name, color, or default-hidden flag for a person tag.',
    history: new HistoryBuilder().added('v1.150.0').stable('v2'),
  })
  updatePersonTag(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: PersonTagUpdateDto,
  ): Promise<PersonTagResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.PersonDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete a person tag',
    description: 'Delete a non-system person tag.',
    history: new HistoryBuilder().added('v1.150.0').stable('v2'),
  })
  deletePersonTag(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }

  @Post(':id/people')
  @Authenticated({ permission: Permission.PersonUpdate })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Attach people to a tag',
    description: 'Add the specified people to the tag.',
    history: new HistoryBuilder().added('v1.150.0').stable('v2'),
  })
  attachPeopleToTag(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: PersonTagAttachDto,
  ): Promise<void> {
    return this.service.attachPeople(auth, id, dto);
  }

  @Delete(':id/people')
  @Authenticated({ permission: Permission.PersonUpdate })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Detach people from a tag',
    description: 'Remove the specified people from the tag.',
    history: new HistoryBuilder().added('v1.150.0').stable('v2'),
  })
  detachPeopleFromTag(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: PersonTagAttachDto,
  ): Promise<void> {
    return this.service.detachPeople(auth, id, dto);
  }

  @Put('person/:id')
  @Authenticated({ permission: Permission.PersonUpdate })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Replace tags for a person',
    description: 'Replace the full tag set on a person with the supplied tag ids.',
    history: new HistoryBuilder().added('v1.150.0').stable('v2'),
  })
  setTagsForPerson(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: PersonTagsAssignDto,
  ): Promise<void> {
    return this.service.setTagsForPerson(auth, id, dto);
  }
}
