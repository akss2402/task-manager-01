import { Router } from "express";
import { requireAuth } from "../auth/authMiddleware.js";
import { getAllUsers, getUserStats } from "./userRepo.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const users = await getAllUsers();
    console.log(`Found ${users.length} users in DB`);
    
    // Enrich with stats
    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const stats = await getUserStats(u.id);
        return { ...u, stats };
      })
    );

    res.json({ users: enrichedUsers });
  } catch (e) {
    next(e);
  }
});

export { router as userRoutes };
