import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository, SelectQueryBuilder } from 'typeorm';
import { VenueService } from '../venue/venue.service';
import type { AuthUser } from 'src/libs/types/jwt-payload.type';
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
    private readonly dataSource: DataSource, // We need inject dataSource to do raw count query if needed
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
    const current = Math.max(1, Number(query.current) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);

    // Helper applying standard filters on any query builder to reduce redundancy
    const applyFilters = (qb: SelectQueryBuilder<TimeSlotTemplate>) => {
      if (query.venueId) qb.andWhere('template.venueId = :venueId', { venueId: query.venueId });
      if (query.courtId) qb.andWhere('template.courtId = :courtId', { courtId: query.courtId });
      if (query.name) qb.andWhere('template.name ILIKE :name', { name: `%${query.name}%` });
      if (query.weekday) qb.andWhere('template.weekday = :weekday', { weekday: query.weekday });
    };

    // 1. Query distinct logical template groups
    const groupQb = this.templateRepository
      .createQueryBuilder('template')
      .select([
        'template.venueId AS "venueId"',
        'template.name AS "name"',
        'template.courtId AS "courtId"',
      ])
      .groupBy('template.venueId')
      .addGroupBy('template.name')
      .addGroupBy('template.courtId')
      .orderBy('template.name', 'ASC');
    
    applyFilters(groupQb);

    // 2. Fetch group count via raw subquery
    const countResult = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'total')
      .from(`(${groupQb.getQuery()})`, 'groups')
      .setParameters(groupQb.getParameters())
      .getRawOne();

    const total = Number(countResult?.total || 0);
    const paginatedGroups = await groupQb
      .offset((current - 1) * limit)
      .limit(limit)
      .getRawMany();

    if (paginatedGroups.length === 0) {
      return {
        items: [],
        total,
        current,
        limit,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
      };
    }

    // 3. Retrieve all concrete records belonging to the selected subset
    const itemsQb = this.templateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.venue', 'venue')
      .leftJoinAndSelect('template.court', 'court')
      .orderBy('template.weekday', 'ASC');

    applyFilters(itemsQb);

    itemsQb.andWhere(
      new Brackets((qb) => {
        paginatedGroups.forEach((group, index) => {
          const clause = `(template.venueId = :vId_${index} AND template.name = :name_${index} AND template.courtId ${
            group.courtId ? `= :cId_${index}` : 'IS NULL'
          })`;

          const params: Record<string, any> = {
            [`vId_${index}`]: group.venueId,
            [`name_${index}`]: group.name,
          };
          if (group.courtId) {
            params[`cId_${index}`] = group.courtId;
          }

          index === 0 ? qb.where(clause, params) : qb.orWhere(clause, params);
        });
      }),
    );

    const items = await itemsQb.getMany();

    return {
      items,
      total,
      current,
      limit,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    };
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
