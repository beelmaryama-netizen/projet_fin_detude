import {
  api,
  prisma,
  resetDb,
  createConfirmedAppointment,
  createUserWithToken,
} from './helpers.js';
import { runReminders } from '../src/services/reminders.service.js';
import {
  sendExpoPush,
  checkPushReceipts,
} from '../src/services/expoPush.service.js';
beforeEach(resetDb);
afterAll(() => prisma.$disconnect());
test('reminders persist once per schedule, honor preferences and exclude cancellations', async () => {
  const now = new Date();
  const start = new Date(+now + 3600000);
  const a = await createConfirmedAppointment({
    start,
    end: new Date(+start + 3600000),
  });
  const b = await createConfirmedAppointment({
    start,
    end: new Date(+start + 3600000),
  });
  const c = await createConfirmedAppointment({
    start,
    end: new Date(+start + 3600000),
  });
  const req = await prisma.serviceRequest.findUnique({
    where: { id: b.requestId },
  });
  await prisma.user.update({
    where: { id: req.clientId },
    data: { notificationPreferences: { reminders: false } },
  });
  await prisma.serviceAppointment.update({
    where: { id: c.id },
    data: { status: 'CANCELLED' },
  });
  await Promise.all([runReminders(now), runReminders(now)]);
  expect(await prisma.notification.count()).toBe(1);
  await prisma.serviceAppointment.update({
    where: { id: a.id },
    data: { scheduledStart: new Date(+start + 3600000) },
  });
  await runReminders(now);
  expect(await prisma.notification.count()).toBe(2);
});
test('push tickets survive restart and invalid device receipts remove stale tokens', async () => {
  const { user, token } = await createUserWithToken();
  await api()
    .post('/api/notifications/devices')
    .set({ Authorization: 'Bearer ' + token })
    .send({ token: 'ExponentPushToken[test-device]', platform: 'IOS' })
    .expect(201);
  const fake = {
    chunkPushNotifications: (items) => [items],
    sendPushNotificationsAsync: async () => [
      { status: 'ok', id: 'receipt-test' },
    ],
    chunkPushNotificationReceiptIds: (ids) => [ids],
    getPushNotificationReceiptsAsync: async () => ({
      'receipt-test': {
        status: 'error',
        details: { error: 'DeviceNotRegistered' },
      },
    }),
  };
  await sendExpoPush(
    ['ExponentPushToken[test-device]'],
    { title: 'Test', body: 'Test', data: {} },
    fake,
  );
  await prisma.pushReceipt.update({
    where: { id: 'receipt-test' },
    data: { createdAt: new Date(Date.now() - 16 * 60000) },
  });
  process.env.EXPO_PUSH_ENABLED = 'true';
  try {
    await checkPushReceipts(fake);
  } finally {
    process.env.EXPO_PUSH_ENABLED = 'false';
  }
  expect(await prisma.deviceToken.count({ where: { userId: user.id } })).toBe(
    0,
  );
  expect(await prisma.pushReceipt.count()).toBe(0);
});
