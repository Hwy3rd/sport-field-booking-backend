import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CourtService } from '../court/court.service';
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
    private readonly courtService: CourtService,
  ) {}

  async create(authUser: AuthUser, dto: CreateTimeSlotTemplateDto) {
    await this.courtService.findOneManageableByUser(authUser, dto.courtId);
    const template = this.templateRepository.create(dto);
    return await this.templateRepository.save(template);
  }

  async findAll(query: TimeSlotTemplateQueryDto) {
    return await filterQuery(
      this.templateRepository,
      {
        current: query.current,
        limit: query.limit,
        filter: {
          courtId: query.courtId,
          weekday: query.weekday,
        },
      },
      {
        sort: { field: 'weekday', order: 'ASC' },
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
    const courtId = dto.courtId ?? template.courtId;
    await this.courtService.findOneManageableByUser(authUser, courtId);
    Object.assign(template, dto);
    return await this.templateRepository.save(template);
  }

  async remove(authUser: AuthUser, id: string) {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Time slot template not found');
    await this.courtService.findOneManageableByUser(authUser, template.courtId);
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
      select: ['id', 'courtId'],
    });
    const courtIds = [...new Set(templates.map((item) => item.courtId))];
    for (const courtId of courtIds) {
      await this.courtService.findOneManageableByUser(authUser, courtId);
    }

    const result = await this.templateRepository.delete({ id: In(uniqueIds) });
    return {
      ids: uniqueIds,
      deletedCount: result.affected ?? 0,
    };
  }
}
