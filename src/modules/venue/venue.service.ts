import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { In, Not, Repository } from 'typeorm';
import { Venue } from './entities/venue.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { VENUE_STATUS } from 'src/libs/constants/venue.constant';
import { filterQuery } from 'src/libs/helpers/filter-query.helper';
import { FilterBodyDto } from 'src/libs/dtos/filter-body.dto';
import { BulkDeleteDto } from 'src/libs/dtos/bulk-delete.dto';
import type { AuthUser } from 'src/libs/types/jwt-payload.type';
import { USER_ROLE } from 'src/libs/constants/user.constant';
import { TimeSlotService } from '../time-slot/time-slot.service';
import { VenueQueryDto } from './dto/venue-query.dto';

@Injectable()
export class VenueService {
  constructor(
    @InjectRepository(Venue)
    private readonly venueRepository: Repository<Venue>,
    @Inject(forwardRef(() => TimeSlotService))
    private readonly timeSlotService: TimeSlotService,
  ) {}

  async findAllByQuery(query: VenueQueryDto) {
    const { name, address, startTime, endTime, ownerId, status } = query;
    const safeQuery = {
      current: query.current,
      limit: query.limit,
      filter: {
        name,
        address,
        startTime,
        endTime,
        ownerId,
        status: status || 'ALL_ACTIVE',
      },
    };

    const venues = await filterQuery(this.venueRepository, safeQuery, {
      regexFields: ['name', 'address'],
      customHandlers: {
        status: (qb, value, alias) => {
          if (value && value !== 'ALL_ACTIVE') {
            qb.andWhere(`${alias}.status = :targetStatus`, {
              targetStatus: String(value),
            });
          } else {
            // Dành cho public user, mặc định là ACTIVE
            qb.andWhere(`${alias}.status = :targetStatus`, {
              targetStatus: VENUE_STATUS.ACTIVE,
            });
          }
        },
        startTime: (qb, value, alias) => {
          qb.andWhere(
            `:startTime < ((${alias}.operating_hours->>'endTime')::time)`,
            {
              startTime: String(value),
            },
          );
        },
        endTime: (qb, value, alias) => {
          qb.andWhere(
            `:endTime > ((${alias}.operating_hours->>'startTime')::time)`,
            {
              endTime: String(value),
            },
          );
        },
      },
    });
    return venues;
  }

  async create(createVenueDto: CreateVenueDto) {
    const existingVenue = await this.venueRepository.findOne({
      where: {
        ownerId: createVenueDto.ownerId,
        name: createVenueDto.name,
        status: Not(VENUE_STATUS.DELETED),
      },
    });
    if (existingVenue) {
      throw new BadRequestException('Venue name is already taken');
    }

    const newVenue = this.venueRepository.create({
      ...createVenueDto,
      status: VENUE_STATUS.ACTIVE,
    });

    return await this.venueRepository.save(newVenue);
  }

  async findOneActiveById(id: string) {
    return await this.venueRepository.findOne({
      where: { id, status: Not(VENUE_STATUS.DELETED) },
      select: ['id', 'ownerId', 'operatingHours'],
    });
  }

  async findOneById(id: string) {
    const venue = await this.venueRepository.findOne({
      where: { id, status: Not(VENUE_STATUS.DELETED) },
    });
    if (!venue) throw new NotFoundException('Venue not found');
    return venue;
  }

  async findOneManageableByUser(authUser: AuthUser, id: string) {
    const venue = await this.findOneById(id);
    if (
      authUser.role === USER_ROLE.OWNER &&
      venue.ownerId !== authUser.id
    ) {
      throw new ForbiddenException('You can only manage your own venue');
    }
    return venue;
  }

  async findAllByFilter(filterBody: FilterBodyDto) {
    const { status, ...rest } = filterBody.filter ?? {};
    const safeFilterBody: FilterBodyDto = {
      ...filterBody,
      filter: {
        ...rest,
        status: status || 'EXCLUDE_DELETED',
      },
    };

    return await filterQuery(this.venueRepository, safeFilterBody, {
      relations: ['owner'],
      regexFields: ['name', 'address'],
      customHandlers: {
        status: (qb, value, alias) => {
          if (value && value !== 'EXCLUDE_DELETED') {
            qb.andWhere(`${alias}.status = :targetStatus`, {
              targetStatus: String(value),
            });
          } else {
            qb.andWhere(`${alias}.status != :excludedStatus`, {
              excludedStatus: VENUE_STATUS.DELETED,
            });
          }
        },
      },
    });
  }

  async update(authUser: AuthUser, id: string, updateVenueDto: UpdateVenueDto) {
    const existingVenue = await this.venueRepository.findOne({
      where: { id, status: Not(VENUE_STATUS.DELETED) },
    });
    if (!existingVenue) throw new NotFoundException('Venue not found');

    if (
      authUser.role === USER_ROLE.OWNER &&
      updateVenueDto.ownerId &&
      updateVenueDto.ownerId !== existingVenue.ownerId
    ) {
      throw new ForbiddenException('Owner cannot change venue owner');
    }

    if (
      authUser.role === USER_ROLE.OWNER &&
      existingVenue.ownerId !== authUser.id
    ) {
      throw new ForbiddenException('You can only update your own venue');
    }

    const targetOwnerId = updateVenueDto.ownerId ?? existingVenue.ownerId;
    const targetName = updateVenueDto.name ?? existingVenue.name;
    const duplicateVenue = await this.venueRepository.findOne({
      where: {
        ownerId: targetOwnerId,
        name: targetName,
        status: Not(VENUE_STATUS.DELETED),
        id: Not(id),
      },
    });
    if (duplicateVenue) {
      throw new BadRequestException('Venue name is already taken');
    }

    Object.assign(existingVenue, updateVenueDto);
    return await this.venueRepository.save(existingVenue);
  }

  async remove(id: string) {
    const existingVenue = await this.venueRepository.findOne({
      where: { id, status: Not(VENUE_STATUS.DELETED) },
    });
    if (!existingVenue) throw new NotFoundException('Venue not found');

    existingVenue.status = VENUE_STATUS.DELETED;
    await this.venueRepository.save(existingVenue);
    await this.timeSlotService.blockAvailableByVenueIds([existingVenue.id]);
    return { id };
  }

  async bulkDelete(ids: BulkDeleteDto) {
    const uniqueIds = [...new Set(ids.ids)];
    if (uniqueIds.length === 0)
      throw new BadRequestException('No venue ids provided');

    const result = await this.venueRepository.update(
      {
        id: In(uniqueIds),
        status: Not(VENUE_STATUS.DELETED),
      },
      { status: VENUE_STATUS.DELETED },
    );
    await this.timeSlotService.blockAvailableByVenueIds(uniqueIds);

    return {
      ids: uniqueIds,
      deletedCount: result.affected ?? 0,
    };
  }
}
