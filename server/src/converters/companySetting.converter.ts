import { parseJson } from "../utils/jsonConverter";
import {
  customerDiscountTierMapSchema,
  CustomerDiscountTierMap,
} from "../schemas/companySetting.schema";

export const customerDiscountTierConverter = (
  raw: unknown,
): CustomerDiscountTierMap => parseJson(customerDiscountTierMapSchema, raw);
