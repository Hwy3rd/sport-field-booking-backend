import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { VenueService } from '../venue/venue.service';
import type { AuthUser } from 'src/libs/types/jwt-payload.type';
import { filterQuery } from 'src/libs/helpers/filter-query.helper';
import { BulkDeleteDto } from 'src/libs/dtos/bulk-delete.dto';
import { TimeSlotTemplate } from './entities/time-slot-template.entity';
import { CreateTimeSlotTemplateDto } from './dto/create-time-slot-template.dto';
import { UpdateTimeSlotTemplateDto } from './dto/update-time-slot-template.dto';
import { TimeSlotTemplateQueryDto } from './dto/time-slot-template-query.dto';

@Injectable()
export class TimeSlotTemplateService {
  constructor(
    @InjectRepository(TimeSlotTemplate)
    private readonly templateRepository: Repository<TimeSlotTemplate>,
    private readonly venueService: VenueService,
  ) {}

  async create(authUser: AuthUser, dto: CreateTimeSlotTemplateDto) {
    await this.venueService.findOneManageableByUser(authUser, dto.venueId);
    
    const { weekdays, ...baseDto } = dto;
    const templatesToSave = weekdays.map((weekday) =>
      this.templateRepository.create({ ...baseDto, weekday })
    );
    
    return await this.templateRepository.save(templatesToSave);
  }

  async findAll(query: TimeSlotTemplateQueryDto) {
    return await filterQuery(
      this.templateRepository,
      {
        current: query.current,
        limit: query.limit,
        filter: {
          venueId: query.venueId,
          courtId: query.courtId,
          name: query.name,
          weekday: query.weekday,
        },
      },
      {
        sort: { field: 'weekday', order: 'ASC' },
        relations: ['venue', 'court'],
      },
    );
  }

  async findOne(id: string) {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Time slot template not found');
    return template;
  }

  async update(authUser: AuthUser, id: string, dto: UpdateTimeSlotTemplateDto) {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Time slot template not found');
    const venueId = dto.venueId ?? template.venueId;
    await this.venueService.findOneManageableByUser(authUser, venueId);
    Object.assign(template, dto);
    return await this.templateRepository.save(template);
  }

  async remove(authUser: AuthUser, id: string) {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Time slot template not found');
    await this.venueService.findOneManageableByUser(authUser, template.venueId);
    await this.templateRepository.remove(template);
    return { id };
  }

  async bulkDelete(authUser: AuthUser, ids: BulkDeleteDto) {
    const uniqueIds = [...new Set(ids.ids)];
    if (uniqueIds.length === 0) {
      throw new BadRequestException('No time slot template ids provided');
    }

    const templates = await this.templateRepository.find({
      where: { id: In(uniqueIds) },
      select: ['id', 'venueId'],
    });
    const venueIds = [...new Set(templates.map((item) => item.venueId))];
    for (const venueId of venueIds) {
      await this.venueService.findOneManageableByUser(authUser, venueId);
    }

    const result = await this.templateRepository.delete({ id: In(uniqueIds) });
    return {
      ids: uniqueIds,
      deletedCount: result.affected ?? 0,
    };
  }

  async getGroupNames(authUser: AuthUser, venueId: string) {
    await this.venueService.findOneManageableByUser(authUser, venueId);
    const result = await this.templateRepository
      .createQueryBuilder('template')
      .select('template.name', 'name')
      .where('template.venue_id = :venueId', { venueId })
      .groupBy('template.name')
      .getRawMany();
    return result.map((item) => item.name);
  }
}
