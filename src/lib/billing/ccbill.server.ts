import { createHash } from "crypto";
import type { BillingProduct } from "@/lib/billing/types";

export type CcbillCheckoutInput = {
  product: BillingProduct;
  returnUrl: string;
  customerEmail?: string;
};

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      "Card payments are being moved to a new provider and aren't available right now. Please try again shortly.",
    );
  }
  return value;
};

/**
 * CCBill pricing is configured per FlexForms sub-account, so each product maps
 * to an initial price + billing period that must match the CCBill config.
 */
const PRODUCT_PRICING: Record<BillingProduct, { price: string; period: string; recurring: boolean }> = {
  plus: { price: "11.99", period: "30", recurring: true },
  premium: { price: "24.99", period: "30", recurring: true },
  boost_single: { price: "2.99", period: "30", recurring: false },
};

const CURRENCY_GBP = "826"; // ISO 4217 numeric, required by CCBill

/**
 * Builds a signed CCBill FlexForms URL. The form digest is an MD5 of the
 * price, period, currency code and the sub-account salt, per CCBill's spec.
 */
export function buildCcbillCheckoutUrl(input: CcbillCheckoutInput, userId: string): string {
  const clientAccnum = getEnv("CCBILL_CLIENT_ACCNUM");
  const clientSubacc = getEnv("CCBILL_CLIENT_SUBACC");
  const flexFormId = getEnv("CCBILL_FLEXFORM_ID");
  const salt = getEnv("CCBILL_SALT");

  const pricing = PRODUCT_PRICING[input.product];
  if (!pricing) throw new Error("Unknown product");

  const digestSource = pricing.recurring
    ? `${pricing.price}${pricing.period}${pricing.price}${pricing.period}99${CURRENCY_GBP}${salt}`
    : `${pricing.price}${pricing.period}${CURRENCY_GBP}${salt}`;
  const formDigest = createHash("md5").update(digestSource).digest("hex");

  const params = new URLSearchParams({
    clientAccnum,
    clientSubacc,
    currencyCode: CURRENCY_GBP,
    initialPrice: pricing.price,
    initialPeriod: pricing.period,
    formDigest,
    // Passthrough values CCBill echoes back on its webhook so we can map the
    // payment to the right member and product.
    "customer_fname": "",
    "X-userId": userId,
    "X-product": input.product,
    "X-returnUrl": input.returnUrl,
    ...(input.customerEmail && { email: input.customerEmail }),
  });

  if (pricing.recurring) {
    params.set("recurringPrice", pricing.price);
    params.set("recurringPeriod", pricing.period);
    params.set("numRebills", "99");
  }

  return `https://api.ccbill.com/wap-frontflex/flexforms/${flexFormId}?${params.toString()}`;
}
