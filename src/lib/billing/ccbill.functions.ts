import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  buildCcbillCheckoutUrl,
  type CcbillCheckoutInput,
} from "@/lib/billing/ccbill.server";

type CcbillCheckoutResult = { url: string } | { error: string };

/**
 * Builds a CCBill FlexForms hosted payment URL for the requested product.
 * Returns a clear error until the CCBill merchant account is approved and its
 * credentials are configured.
 */
export const createCcbillCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CcbillCheckoutInput) => data)
  .handler(async ({ data, context }): Promise<CcbillCheckoutResult> => {
    try {
      return { url: buildCcbillCheckoutUrl(data, context.userId) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Could not start checkout" };
    }
  });
