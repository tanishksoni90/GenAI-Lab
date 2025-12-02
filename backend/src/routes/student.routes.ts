import { Router } from 'express';
import * as studentController from '../controllers/student.controller';
import { authenticate, requireStudent } from '../middleware/auth';

const router = Router();

// All routes require authentication and student role
router.use(authenticate);
router.use(requireStudent);

// Dashboard
router.get('/dashboard', studentController.getDashboard);
router.get('/recent-sessions', studentController.getRecentSessions);

// Leaderboard
router.get('/leaderboard', studentController.getLeaderboard);
router.get('/rank', studentController.getCourseRank);

// Activity
router.get('/activity-calendar', studentController.getActivityCalendar);

export default router;

