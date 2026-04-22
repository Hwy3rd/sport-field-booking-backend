import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';

export interface FilterData {
  current: number;
  limit: number;
  filter?: Record<string, unknown>;
}

export type CustomFieldHandler<T extends ObjectLiteral> = (
  qb: SelectQueryBuilder<T>,
  value: unknown,
  alias: string,
) => void;

export interface FilterQueryOptions<T extends ObjectLiteral> {
  /**
   * Các field sẽ search kiểu LIKE (case-insensitive: ILIKE '%value%').
   */
  regexFields?: string[];

  /**
   * Các field dạng range: filter[field] = [start, end] -> BETWEEN.
   * Hỗ trợ: [start, end], [start, null] (>= start), [null, end] (<= end).
   */
  rangeFields?: string[];

  /**
   * Các field match chính xác (=) hoặc IN nếu value là array.
   * Nếu không khai báo, helper fallback sang so khớp bằng = cho mọi field
   * tồn tại trong entity (không thuộc regex/range/custom).
   */
  exactFields?: string[];

  /**
   * Custom handler cho từng key trong filter (ưu tiên cao nhất).
   */
  customHandlers?: Record<string, CustomFieldHandler<T>>;

  /**
   * Field sort ưu tiên. Nếu không truyền sẽ dùng defaultSortField.
   */
  sort?: { field: string; order?: 'ASC' | 'DESC' };

  /**
   * Mặc định 'createdAt' DESC (mới nhất trước).
   */
  defaultSortField?: string;

  /**
   * Chỉ lấy các field này.
   */
  select?: string[];

  /**
   * Loại bỏ các field này (chỉ áp dụng khi không truyền select).
   */
  omit?: string[];

  /**
   * Alias cho query builder, mặc định = tableName.
   */
  alias?: string;
}

export interface FilterQueryResult<T> {
  items: T[];
  total: number;
  current: number;
  limit: number;
  totalPages: number;
}

/**
 * Helper tìm kiếm danh sách theo FilterData gửi từ FE.
 *
 * FilterData dạng: { current, limit, filter: {...} }
 * - regexFields: ILIKE '%value%'
 * - rangeFields: BETWEEN start AND end (hoặc >=, <= nếu 1 đầu null)
 * - customHandlers: toàn quyền chỉnh query builder
 * - select/omit: tuỳ chọn field trả về
 * - sort: mặc định createdAt DESC
 *
 * Trả về { items, total, current, limit, totalPages }.
 */
export async function filterQuery<T extends ObjectLiteral>(
  repo: Repository<T>,
  filterData: FilterData,
  options: FilterQueryOptions<T> = {},
): Promise<FilterQueryResult<T>> {
  const alias = options.alias ?? repo.metadata.tableName;
  const qb = repo.createQueryBuilder(alias);

  const filter = filterData.filter ?? {};
  const columns = repo.metadata.columns.map((c) => c.propertyName);

  const regexFields = new Set(options.regexFields ?? []);
  const rangeFields = new Set(options.rangeFields ?? []);
  const exactFields = new Set(options.exactFields ?? []);
  const customHandlers = options.customHandlers ?? {};

  let paramIndex = 0;
  const nextParam = (key: string) =>
    `p_${key.replace(/[^a-zA-Z0-9_]/g, '_')}_${paramIndex++}`;

  for (const [key, rawValue] of Object.entries(filter)) {
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      continue;
    }

    if (customHandlers[key]) {
      customHandlers[key](qb, rawValue, alias);
      continue;
    }

    if (
      rangeFields.has(key) &&
      Array.isArray(rawValue) &&
      rawValue.length === 2
    ) {
      if (!columns.includes(key)) continue;

      const [start, end] = rawValue as [unknown, unknown];
      const startParam = nextParam(key);
      const endParam = nextParam(key);

      if (
        start !== null &&
        start !== undefined &&
        end !== null &&
        end !== undefined
      ) {
        qb.andWhere(`${alias}.${key} BETWEEN :${startParam} AND :${endParam}`, {
          [startParam]: start,
          [endParam]: end,
        });
      } else if (start !== null && start !== undefined) {
        qb.andWhere(`${alias}.${key} >= :${startParam}`, {
          [startParam]: start,
        });
      } else if (end !== null && end !== undefined) {
        qb.andWhere(`${alias}.${key} <= :${endParam}`, { [endParam]: end });
      }
      continue;
    }

    if (regexFields.has(key)) {
      if (!columns.includes(key)) continue;
      const param = nextParam(key);
      qb.andWhere(`${alias}.${key} ILIKE :${param}`, {
        [param]: `%${String(rawValue)}%`,
      });
      continue;
    }

    const isExactAllowed =
      exactFields.size === 0 ? columns.includes(key) : exactFields.has(key);

    if (isExactAllowed && columns.includes(key)) {
      const param = nextParam(key);
      if (Array.isArray(rawValue)) {
        qb.andWhere(`${alias}.${key} IN (:...${param})`, {
          [param]: rawValue,
        });
      } else {
        qb.andWhere(`${alias}.${key} = :${param}`, { [param]: rawValue });
      }
    }
  }

  if (options.select && options.select.length > 0) {
    qb.select(options.select.map((f) => `${alias}.${f}`));
  } else if (options.omit && options.omit.length > 0) {
    const omitSet = new Set(options.omit);
    qb.select(
      columns.filter((c) => !omitSet.has(c)).map((c) => `${alias}.${c}`),
    );
  }

  const sortField =
    options.sort?.field ?? options.defaultSortField ?? 'createdAt';
  const sortOrder = options.sort?.order ?? 'DESC';
  if (columns.includes(sortField)) {
    qb.orderBy(`${alias}.${sortField}`, sortOrder);
  }

  const current = Math.max(1, Number(filterData.current) || 1);
  const limit = Math.max(1, Number(filterData.limit) || 10);
  qb.skip((current - 1) * limit).take(limit);

  const [items, total] = await qb.getManyAndCount();

  return {
    items,
    total,
    current,
    limit,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}
