import { api, prisma, resetDb, createUserWithToken } from './helpers.js';
import { notify } from '../src/services/notifications.service.js';
beforeEach(resetDb);
afterAll(() => prisma.$disconnect());
test('saved notification preferences suppress only the chosen category', async () => {
 const client = await createUserWithToken();
 await api().put('/api/preferences').set({ Authorization: 'Bearer ' + client.token }).send({ newQuotes: false, bookingConfirmations: true }).expect(200);
 await notify([client.user.id], 'QUOTE_SENT');
 await notify([client.user.id], 'APPOINTMENT_CONFIRMED');
 const notifications = await prisma.notification.findMany({ where: { userId: client.user.id } });
 expect(notifications.map(n => n.type)).toEqual(['APPOINTMENT_CONFIRMED']);
});
