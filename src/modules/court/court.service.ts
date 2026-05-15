import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { In, Not, Repository } from 'typeorm';
import { Court } from './entities/court.entity';
import { COURT_STATUS } from 'src/libs/constants/court.constant';
import { filterQuery } from 'src/libs/helpers/filter-query.helper';
import { BulkDeleteDto } from 'src/libs/dtos/bulk-delete.dto';
import type { AuthUser } from 'src/libs/types/jwt-payload.type';
import { USER_ROLE } from 'src/libs/constants/user.constant';
import { VenueService } from '../venue/venue.service';
import { SportService } from '../sport/sport.service';
import { CourtQueryDto } from './dto/court-query.dto';
import { TimeSlotService } from '../time-slot/time-slot.service';
import { TimeSlot } from '../time-slot/entities/time-slot.entity';
import { TimeSlotTemplate } from '../time-slot/entities/time-slot-template.entity';
import {
  TIME_SLOT_STATUS,
  type TimeSlotStatus,
} from 'src/libs/constants/time-slot.constant';

@Injectable()
export class CourtService {
  constructor(
    @InjectRepository(Court)
    private readonly courtRepository: Repository<Court>,
    @Inject(forwardRef(() => VenueService))
    private readonly venueService: VenueService,
    private readonly sportService: SportService,
    @Inject(forwardRef(() => TimeSlotService))
    private readonly timeSlotService: TimeSlotService,
    @InjectRepository(TimeSlot)
    private readonly timeSlotRepository: Repository<TimeSlot>,
    @InjectRepository(TimeSlotTemplate)
    private readonly timeSlotTemplateRepository: Repository<TimeSlotTemplate>,
  ) {}

  private async checkTemplateOverlap(venueId: string, templateNames?: string[]) {
    if (!templateNames || templateNames.length === 0) return;
    const templates = await this.timeSlotTemplateRepository.find({
      where: {
        venueId,
        name: In(templateNames),
        isActive: true,
      },
    });

    const byWeekday = new Map<number, TimeSlotTemplate[]>();
    for (const t of templates) {
      if (!byWeekday.has(t.weekday)) byWeekday.set(t.weekday, []);
      byWeekday.get(t.weekday)!.push(t);
    }

    for (const [weekday, dayTemplates] of byWeekday) {
      for (let i = 0; i < dayTemplates.length; i++) {
        for (let j = i + 1; j < dayTemplates.length; j++) {
          const t1 = dayTemplates[i];
          const t2 = dayTemplates[j];
          if (t1.startTime < t2.endTime && t1.endTime > t2.startTime) {
            throw new BadRequestException('Selected templates have overlapping times.');
          }
        }
      }
    }
  }

  async create(createCourtDto: CreateCourtDto) {
    const venue = await this.venueService.findOneActiveById(
      createCourtDto.venueId,
    );
    if (!venue) throw new NotFoundException('Venue not found');

    const sport = await this.sportService.findOneActiveById(
      createCourtDto.sportId,
    );
    if (!sport) throw new NotFoundException('Sport not found');

    const existingCourt = await this.courtRepository.findOne({
      where: {
        venueId: createCourtDto.venueId,
        name: createCourtDto.name,
        status: Not(COURT_STATUS.DELETED),
      },
    });
    if (existingCourt) {
      throw new BadRequestException(
        'Court name is already taken in this venue',
      );
    }

    const { templateNames, manualTimeSlots, ...courtData } = createCourtDto;

    await this.checkTemplateOverlap(createCourtDto.venueId, templateNames);

    const newCourt = this.courtRepository.create({
      ...courtData,
      templateNames: templateNames ?? [],
      status: COURT_STATUS.ACTIVE,
    });

    const savedCourt = await this.courtRepository.save(newCourt);

    await this.timeSlotService.bulkGenerateForCourt(
      savedCourt.id,
      savedCourt.venueId,
      templateNames,
      manualTimeSlots,
    );

    return savedCourt;
  }

  async findAllByFilter(query: CourtQueryDto) {
    const safeQuery = {
      current: query.current,
      limit: query.limit,
      filter: {
        name: query.name,
        sportId: query.sportId,
        venueId: query.venueId,
        pricePerHour: [query.minPrice ?? null, query.maxPrice ?? null],
        status: query.status || 'EXCLUDE_DELETED',
      },
    };

    const result = await filterQuery(this.courtRepository, safeQuery, {
      regexFields: ['name'],
      rangeFields: ['pricePerHour'],
      customHandlers: {
        status: (qb, value, alias) => {
          if (value && value !== 'EXCLUDE_DELETED') {
            qb.andWhere(`${alias}.status = :targetStatus`, {
              targetStatus: String(value),
            });
          } else {
            qb.andWhere(`${alias}.status != :excludedStatus`, {
              excludedStatus: COURT_STATUS.DELETED,
            });
          }
        },
      },
    });

    const items = result.items ?? [];
    if (items.length === 0) return result;

    const courtsWithRelations = await this.courtRepository.find({
      where: { id: In(items.map((item) => item.id)) },
      relations: { venue: true, sport: true },
    });
    const relationMap = new Map(courtsWithRelations.map((item) => [item.id, item]));

    return {
      ...result,
      items: items.map((item) => {
        const related = relationMap.get(item.id);
        if (!related) return item;
        return {
          ...item,
          venue: related.venue,
          sport: related.sport,
        };
      }),
    };
  }

  async findOneActiveById(id: string) {
    return await this.courtRepository.findOne({
      where: { id, status: Not(COURT_STATUS.DELETED) },
      select: ['id'],
    });
  }

  async findOneById(id: string) {
    const court = await this.courtRepository.findOne({
      where: { id, status: Not(COURT_STATUS.DELETED) },
      relations: { venue: true, sport: true },
    });
    if (!court) throw new NotFoundException('Court not found');
    return court;
  }

  async findOneManageableByUser(authUser: AuthUser, id: string) {
    const court = await this.courtRepository.findOne({
      where: { id, status: Not(COURT_STATUS.DELETED) },
      relations: { venue: true },
    });
    if (!court) throw new NotFoundException('Court not found');

    if (
      authUser.role === USER_ROLE.OWNER &&
      court.venue.ownerId !== authUser.id
    ) {
      throw new ForbiddenException(
        'You can only manage courts in your own venue',
      );
    }

    return court;
  }

  async update(authUser: AuthUser, id: string, updateCourtDto: UpdateCourtDto) {
    const existingCourt = await this.courtRepository.findOne({
      where: { id, status: Not(COURT_STATUS.DELETED) },
      relations: { venue: true },
    });
    if (!existingCourt) throw new NotFoundException('Court not found');

    if (
      authUser.role === USER_ROLE.OWNER &&
      existingCourt.venue.ownerId !== authUser.id
    ) {
      throw new ForbiddenException(
        'You can only update courts in your own venue',
      );
    }

    if (
      updateCourtDto.venueId &&
      updateCourtDto.venueId !== existingCourt.venueId
    ) {
      const targetVenue = await this.venueService.findOneActiveById(
        updateCourtDto.venueId,
      );
      if (!targetVenue) throw new NotFoundException('Venue not found');

      if (
        authUser.role === USER_ROLE.OWNER &&
        targetVenue.ownerId !== authUser.id
      ) {
        throw new ForbiddenException(
          'Owner cannot move court to another owner',
        );
      }
    }

    const targetSportId = updateCourtDto.sportId;
    if (targetSportId) {
      const sport = await this.sportService.findOneActiveById(targetSportId);
      if (!sport) throw new NotFoundException('Sport not found');
    }

    const targetVenueId = updateCourtDto.venueId ?? existingCourt.venueId;
    const targetName = updateCourtDto.name ?? existingCourt.name;
    const duplicateCourt = await this.courtRepository.findOne({
      where: {
        venueId: targetVenueId,
        name: targetName,
        status: Not(COURT_STATUS.DELETED),
        id: Not(id),
      },
      select: ['id'],
    });
    if (duplicateCourt) {
      throw new BadRequestException(
        'Court name is already taken in this venue',
      );
    }

    const { templateNames, manualTimeSlots, ...courtData } = updateCourtDto;

    if (templateNames !== undefined) {
      await this.checkTemplateOverlap(targetVenueId, templateNames);
      existingCourt.templateNames = templateNames;
    }

    Object.assign(existingCourt, courtData);
    const updatedCourt = await this.courtRepository.save(existingCourt);

    // Generate new time slots if any new templates or manual slots are provided
    if (templateNames !== undefined || (manualTimeSlots && manualTimeSlots.length > 0)) {
      await this.timeSlotService.bulkGenerateForCourt(
        updatedCourt.id,
        updatedCourt.venueId,
        templateNames !== undefined ? templateNames : updatedCourt.templateNames,
        manualTimeSlots,
      );
    }

    return updatedCourt;
  }

  async remove(id: string) {
    const existingCourt = await this.courtRepository.findOne({
      where: { id, status: Not(COURT_STATUS.DELETED) },
      select: ['id', 'status'],
    });
    if (!existingCourt) throw new NotFoundException('Court not found');

    existingCourt.status = COURT_STATUS.DELETED;
    await this.courtRepository.save(existingCourt);
    await this.timeSlotService.blockAvailableByCourtIds([existingCourt.id]);
    return { id };
  }

  async bulkDelete(ids: BulkDeleteDto) {
    const uniqueIds = [...new Set(ids.ids)];
    if (uniqueIds.length === 0)
      throw new BadRequestException('No court ids provided');

    const result = await this.courtRepository.update(
      {
        id: In(uniqueIds),
        status: Not(COURT_STATUS.DELETED),
      },
      { status: COURT_STATUS.DELETED },
    );
    await this.timeSlotService.blockAvailableByCourtIds(uniqueIds);

    return {
      ids: uniqueIds,
      deletedCount: result.affected ?? 0,
    };
  }

}
