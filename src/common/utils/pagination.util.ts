import { FindManyOptions, FindOptionsOrder, Repository, ObjectLiteral } from 'typeorm';

interface PaginationOptions<T = any> extends Omit<FindManyOptions<T>, 'skip' | 'take'> {
  page?: number;
  limit?: number;
  order?: FindOptionsOrder<T>;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function paginate<T extends ObjectLiteral>(
  repository: Repository<T>,
  options: PaginationOptions<T> = {},
): Promise<PaginationResult<T>> {
  const page = options.page ? Number(options.page) : 1;
  const limit = options.limit ? Number(options.limit) : 10;
  const skip = (page - 1) * limit;

  // Create a copy of options without pagination specific fields
  const { page: _, limit: __, ...findOptions } = options;

  const [data, total] = await repository.findAndCount({
    ...findOptions,
    skip,
    take: limit,
  });
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

export interface PaginationResponse<T> {
  message: string;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  data: T[];
}

export function createPaginationResponse<T>(
  result: PaginationResult<T>,
  message = 'Fetch successful',
): PaginationResponse<T> {
  return {
    message,
    pagination: result.pagination,
    data: result.data,
  };
}
