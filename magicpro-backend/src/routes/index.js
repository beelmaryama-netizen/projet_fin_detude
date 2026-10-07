import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import addressesRoutes from './addresses.routes.js';
import requestsRoutes from './requests.routes.js';
import quotesRoutes from './quotes.routes.js';
import appointmentsRoutes from './appointments.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/addresses', addressesRoutes);
// quotesRoutes AVANT requestsRoutes : il gère /requests/:requestId/quotes
router.use(quotesRoutes);
router.use('/requests', requestsRoutes);
router.use('/appointments', appointmentsRoutes);
// Prochain module :
// router.use('/missions', missionsRoutes);

export default router;
