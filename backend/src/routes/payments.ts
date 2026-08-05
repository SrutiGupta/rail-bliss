import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";
import { AppError } from "../utils/errors";
import { chargePayment } from "../services/payments";

const router = Router();

// POST /api/payments/charge — exposed payment-gateway endpoint (mock).
router.post(
  "/charge",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = z
      .object({
        amount: z.coerce.number().positive("Amount must be greater than zero"),
        description: z.string().trim().min(1).max(500).default("RailYatra booking"),
      })
      .safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0]!.message);

    const charge = await chargePayment({
      amount: parsed.data.amount,
      currency: "INR",
      description: parsed.data.description,
      referenceId: `PAY_${Date.now()}`,
    });

    res.json(charge);
  }),
);

export default router;