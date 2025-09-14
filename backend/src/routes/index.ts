import { Router } from 'express';
import authRouter from '@/modules/auth/auth.routes';
import userRouter from '@/modules/user/user.routes';
import healthRouter from '@/modules/health/health.routes';
import calendarRouter from '@/modules/calendar/calendar.routes';
import aiRouter from '@/modules/ai/ai.routes';
import slackRouter from '@/modules/slack/slack.routes';
import notificationRouter from '@/modules/notifications/notification.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/health', healthRouter);
router.use('/calendar', calendarRouter);
router.use('/ai', aiRouter);
router.use('/slack', slackRouter);
router.use('/notifications', notificationRouter);

export default router;
