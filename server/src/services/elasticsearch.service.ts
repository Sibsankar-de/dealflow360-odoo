import { getElasticsearchClient } from "../lib/elasticsearch";
import { env } from "../configs/env";
import { createModuleLogger } from "../utils/logger";
import { prisma } from "../lib/prisma";
import {
  ProductSummaryResponseDto,
  toProductSummaryDto,
} from "../dto/product.dto";
import {
  CustomerSummaryResponseDto,
  toCustomerSummaryDto,
} from "../dto/customer.dto";

const log = createModuleLogger(import.meta.url);

export class ElasticsearchService {
  public async searchProducts(
    companyId: string,
    query: string,
    limit = 10,
  ): Promise<ProductSummaryResponseDto[]> {
    if (!query || !query.trim()) {
      return [];
    }

    try {
      const es = getElasticsearchClient();
      const response = await es.search({
        index: env.ELASTICSEARCH_PRODUCTS_INDEX,
        size: limit,
        _source: false,
        query: {
          bool: {
            filter: [{ term: { companyId } }],
            should: [
              {
                match: {
                  name: {
                    query,
                    fuzziness: "AUTO",
                    boost: 3,
                  },
                },
              },
              {
                match_phrase_prefix: {
                  name: {
                    query,
                    boost: 2.5,
                  },
                },
              },
              {
                match: {
                  description: {
                    query,
                    fuzziness: "AUTO",
                    boost: 1,
                  },
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
      });

      const hitIds: string[] = response.hits.hits.flatMap((hit) =>
        hit._id ? [hit._id] : [],
      );

      if (hitIds.length === 0) {
        return [];
      }

      const products = await prisma.product.findMany({
        where: {
          id: { in: hitIds },
          companyId,
        },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));
      const result: ProductSummaryResponseDto[] = [];

      for (const id of hitIds) {
        const product = productMap.get(id);
        if (product) {
          result.push(toProductSummaryDto(product));
        }
      }

      return result;
    } catch (err) {
      log.warn(
        `[ES Search] Product search failed, falling back to database: ${err}`,
      );
      return this.fallbackSearchProducts(companyId, query, limit);
    }
  }

  private async fallbackSearchProducts(
    companyId: string,
    query: string,
    limit: number,
  ): Promise<ProductSummaryResponseDto[]> {
    const term = decodeURIComponent(query);
    const results = await prisma.product.findMany({
      where: {
        companyId,
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
        ],
      },
      take: limit,
    });

    return results.map(toProductSummaryDto);
  }

  public async searchCustomers(
    companyId: string,
    query: string,
    limit = 10,
  ): Promise<CustomerSummaryResponseDto[]> {
    if (!query || !query.trim()) {
      return [];
    }

    try {
      const es = getElasticsearchClient();
      const response = await es.search({
        index: env.ELASTICSEARCH_USERS_INDEX,
        size: limit,
        _source: false,
        query: {
          bool: {
            should: [
              { term: { email: { value: query, boost: 4 } } },
              { prefix: { email: { value: query, boost: 2 } } },
              {
                match: {
                  name: {
                    query,
                    fuzziness: "AUTO",
                    boost: 3,
                  },
                },
              },
              {
                match_phrase_prefix: {
                  name: {
                    query,
                    boost: 2.5,
                  },
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
      });

      const hitIds: string[] = response.hits.hits.flatMap((hit) =>
        hit._id ? [hit._id] : [],
      );

      if (hitIds.length === 0) {
        return [];
      }

      const users = await prisma.user.findMany({
        where: {
          id: { in: hitIds },
        },
        include: {
          companyUsers: {
            where: { companyId },
          },
        },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));
      const result: CustomerSummaryResponseDto[] = [];

      for (const id of hitIds) {
        const user = userMap.get(id);
        if (user) {
          result.push(toCustomerSummaryDto(user, companyId));
        }
      }

      return result;
    } catch (err) {
      log.warn(
        `[ES Search] Customer search failed, falling back to database: ${err}`,
      );
      return this.fallbackSearchCustomers(companyId, query, limit);
    }
  }

  private async fallbackSearchCustomers(
    companyId: string,
    query: string,
    limit: number,
  ): Promise<CustomerSummaryResponseDto[]> {
    const term = decodeURIComponent(query);
    const results = await prisma.user.findMany({
      where: {
        OR: [
          { userName: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
        ],
      },
      include: {
        companyUsers: {
          where: { companyId },
        },
      },
      take: limit,
    });

    return results.map((u) => toCustomerSummaryDto(u, companyId));
  }
}

export const elasticsearchService = new ElasticsearchService();

export const searchProductsInElasticsearch = (
  companyId: string,
  query: string,
  limit?: number,
): Promise<ProductSummaryResponseDto[]> =>
  elasticsearchService.searchProducts(companyId, query, limit);

export const searchCustomersInElasticsearch = (
  companyId: string,
  query: string,
  limit?: number,
): Promise<CustomerSummaryResponseDto[]> =>
  elasticsearchService.searchCustomers(companyId, query, limit);
