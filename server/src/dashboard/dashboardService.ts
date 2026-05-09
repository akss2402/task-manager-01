import * as repo from "./dashboardRepo.js";

export async function getOverview(userId: string, role: string) {
  return repo.getOverviewStats(userId, role);
}

export async function getMyTasks(input: {
  userId: string;
  role: string;
  status?: string;
  overdueOnly?: boolean;
  projectId?: string;
  limit?: number;
}) {
  return repo.getMyTasks(input);
}

export async function getProjectStats(projectId: string) {
  return repo.getProjectStats(projectId);
}
