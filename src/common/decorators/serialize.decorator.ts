import { SetMetadata } from '@nestjs/common';
import { SERIALIZE_DTO } from 'src/libs/constants/metadata.constant';

export const Serialize = (dto: new (...args: any[]) => object) =>
  SetMetadata(SERIALIZE_DTO, dto);
