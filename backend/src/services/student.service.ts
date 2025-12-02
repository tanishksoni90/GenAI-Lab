import { prisma } from '../lib/prisma';
import { NotFoundError } from '../utils/errors';

// Get student dashboard stats
export const getDashboardStats = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      tokenQuota: true,
      tokenUsed: true,
      course: { select: { id: true, name: true } },
      batch: { select: { id: true, name: true } },
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Get session stats
  const sessionStats = await prisma.session.aggregate({
    where: { userId },
    _count: true,
    _avg: { avgScore: true },
  });

  // Get total prompts
  const promptCount = await prisma.message.count({
    where: { 
      session: { userId },
      role: 'user',
    },
  });

  // Get artifact count
  const artifactCount = await prisma.artifact.count({
    where: { userId },
  });

  // Get agent count
  const agentCount = await prisma.agent.count({
    where: { userId },
  });

  // Get recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentActivity = await prisma.activityLog.findMany({
    where: {
      userId,
      createdAt: { gte: thirtyDaysAgo },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Calculate tokens remaining
  const tokensRemaining = user.tokenQuota - user.tokenUsed;
  const tokenUsagePercent = (user.tokenUsed / user.tokenQuota) * 100;

  return {
    user: {
      id: user.id,
      name: user.name,
      course: user.course,
      batch: user.batch,
    },
    stats: {
      sessions: sessionStats._count || 0,
      avgScore: Math.round((sessionStats._avg.avgScore || 0) * 10) / 10,
      prompts: promptCount,
      artifacts: artifactCount,
      agents: agentCount,
    },
    tokens: {
      quota: user.tokenQuota,
      used: user.tokenUsed,
      remaining: tokensRemaining,
      usagePercent: Math.round(tokenUsagePercent * 10) / 10,
    },
    recentActivity,
  };
};

// Get student's recent sessions
export const getRecentSessions = async (userId: string, limit: number = 10) => {
  return prisma.session.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    include: {
      model: {
        select: { id: true, name: true, provider: true, category: true },
      },
      agent: {
        select: { id: true, name: true },
      },
      _count: {
        select: { messages: true },
      },
    },
  });
};

// Get leaderboard
export const getLeaderboard = async (
  type: 'institutional' | 'course',
  courseId?: string,
  limit: number = 20
) => {
  const where: any = { role: 'student', isActive: true };
  
  if (type === 'course' && courseId) {
    where.courseId = courseId;
  }

  const students = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      registrationId: true,
      course: { select: { name: true } },
      sessions: {
        select: {
          avgScore: true,
          tokensUsed: true,
        },
      },
    },
  });

  // Calculate scores and rank
  const leaderboard = students.map((student) => {
    const totalSessions = student.sessions.length;
    const avgScore = totalSessions > 0
      ? student.sessions.reduce((sum, s) => sum + s.avgScore, 0) / totalSessions
      : 0;
    const totalTokens = student.sessions.reduce((sum, s) => sum + s.tokensUsed, 0);

    return {
      id: student.id,
      name: student.name,
      registrationId: student.registrationId,
      course: student.course?.name || 'N/A',
      avgScore: Math.round(avgScore * 10) / 10,
      sessions: totalSessions,
      tokensUsed: totalTokens,
    };
  });

  // Sort by average score
  leaderboard.sort((a, b) => b.avgScore - a.avgScore);

  // Add rank
  return leaderboard.slice(0, limit).map((entry, index) => ({
    rank: index + 1,
    ...entry,
  }));
};

// Get student's course rank
export const getCourseRank = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { courseId: true },
  });

  if (!user?.courseId) {
    return { rank: null, total: 0 };
  }

  const leaderboard = await getLeaderboard('course', user.courseId, 1000);
  const userRank = leaderboard.find((entry) => entry.id === userId);

  return {
    rank: userRank?.rank || null,
    total: leaderboard.length,
  };
};

// Get activity calendar (days with activity in current month)
export const getActivityCalendar = async (userId: string) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const activities = await prisma.activityLog.findMany({
    where: {
      userId,
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      action: { in: ['session_start', 'agent_create', 'login'] },
    },
    select: { createdAt: true },
  });

  // Get unique active days
  const activeDays = new Set<number>();
  activities.forEach((activity) => {
    activeDays.add(activity.createdAt.getDate());
  });

  // Calculate streak
  let streak = 0;
  const today = now.getDate();
  for (let day = today; day >= 1; day--) {
    if (activeDays.has(day)) {
      streak++;
    } else {
      break;
    }
  }

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    activeDays: Array.from(activeDays).sort((a, b) => a - b),
    totalActiveDays: activeDays.size,
    currentStreak: streak,
  };
};

