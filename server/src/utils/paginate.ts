export interface PaginateOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginateModel<T> {
  findMany: (args: {
    where?: object;
    orderBy?: object | object[];
    skip?: number;
    take?: number;
    include?: object;
  }) => Promise<T[]>;
  count: (args: { where?: object }) => Promise<number>;
}

export async function paginate<T>(
  model: PaginateModel<T>,
  where: object,
  orderBy: object | object[],
  options: PaginateOptions,
  include?: object,
): Promise<PaginatedResult<T>> {
  const { page, limit } = options;
  const skip = (page - 1) * limit;

  const [docs, totalDocs] = await Promise.all([
    model.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      ...(include ? { include } : {}),
    }),
    model.count({ where }),
  ]);

  const totalPages = Math.ceil(totalDocs / limit);

  return {
    docs,
    totalDocs,
    limit,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
