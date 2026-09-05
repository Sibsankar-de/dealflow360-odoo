import { StatusCodes } from "http-status-codes";
import {
  CustomerRepository,
  customerRepository as defaultCustomerRepository,
} from "../repositories/customer.repository";
import {
  CompanyRepository,
  companyRepository as defaultCompanyRepository,
} from "../repositories/company.repository";
import { ApiError } from "../utils/apiErrorHandler";
import { PaginatedResult } from "../utils/paginate";
import {
  CustomerListQueryDto,
  CustomerResponseDto,
  toCustomerDto,
} from "../dto/customer.dto";

export class CustomerService {
  private customerRepo: CustomerRepository;
  private companyRepo: CompanyRepository;

  public constructor(
    customerRepo: CustomerRepository = defaultCustomerRepository,
    companyRepo: CompanyRepository = defaultCompanyRepository,
  ) {
    this.customerRepo = customerRepo;
    this.companyRepo = companyRepo;
  }

  public async listCustomers(
    companyId: string,
    filters: CustomerListQueryDto,
  ): Promise<PaginatedResult<CustomerResponseDto>> {
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const result = await this.customerRepo.findCustomers(
      companyId,
      {
        search: filters.search,
        customerTier: filters.customerTier,
      },
      { page, limit },
    );

    return {
      ...result,
      docs: result.docs.map((user) => toCustomerDto(user, companyId)),
    };
  }

  public async getCustomer(
    companyId: string,
    customerId: string,
  ): Promise<CustomerResponseDto> {
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Company not found");
    }

    const customer = await this.customerRepo.findById(companyId, customerId);
    if (!customer) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Customer not found");
    }

    return toCustomerDto(customer, companyId);
  }
}

export const customerService = new CustomerService();
