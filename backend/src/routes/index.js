import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import addressesRoutes from './addresses.routes.js';
import requestsRoutes from './requests.routes.js';
import quotesRoutes from './quotes.routes.js';
import appointmentsRoutes from './appointments.routes.js';
import missionsRoutes from './missions.routes.js';
import photosRoutes from './photos.routes.js';
import notificationsRoutes from './notifications.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/addresses', addressesRoutes);
// Montés à la racine AVANT /requests et /missions : ils gèrent
// /requests/:id/quotes, /requests/:id/photos, /missions/:id/photos, /uploads/signature
router.use(quotesRoutes);
router.use(photosRoutes);
router.use('/requests', requestsRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/missions', missionsRoutes);
router.use('/notifications', notificationsRoutes);

export default router;
