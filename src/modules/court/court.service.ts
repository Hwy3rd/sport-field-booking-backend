import {
  BadRequestException,
  ForbiddenException,
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
import { FilterBodyDto } from 'src/libs/dtos/filter-body.dto';
import { BulkDeleteDto } from 'src/libs/dtos/bulk-delete.dto';
import type { AuthUser } from 'src/libs/types/jwt-payload.type';
import { USER_ROLE } from 'src/libs/constants/user.constant';
import { VenueService } from '../venue/venue.service';
import { SportService } from '../sport/sport.service';

@Injectable()
export class CourtService {
  constructor(
    @InjectRepository(Court)
    private readonly courtRepository: Repository<Court>,
    private readonly venueService: VenueService,
    private readonly sportService: SportService,
  ) {}

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

    const newCourt = this.courtRepository.create({
      ...createCourtDto,
      status: COURT_STATUS.ACTIVE,
    });

    return await this.courtRepository.save(newCourt);
  }

  async findAllByFilter(filterBody: FilterBodyDto) {
    const safeFilterBody: FilterBodyDto = {
      ...filterBody,
      filter: {
        ...(filterBody.filter ?? {}),
        status: COURT_STATUS.ACTIVE,
      },
    };

    return await filterQuery(this.courtRepository, safeFilterBody, {
      regexFields: ['name'],
    });
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

    Object.assign(existingCourt, updateCourtDto);
    return await this.courtRepository.save(existingCourt);
  }

  async remove(id: string) {
    const existingCourt = await this.courtRepository.findOne({
      where: { id, status: Not(COURT_STATUS.DELETED) },
      select: ['id', 'status'],
    });
    if (!existingCourt) throw new NotFoundException('Court not found');

    existingCourt.status = COURT_STATUS.DELETED;
    await this.courtRepository.save(existingCourt);
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

    return {
      ids: uniqueIds,
      deletedCount: result.affected ?? 0,
    };
  }
}
