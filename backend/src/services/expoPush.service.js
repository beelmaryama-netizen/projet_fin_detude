import { Expo } from 'expo-server-sdk';
import { prisma } from '../config/prisma.js';
const client = () => new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
export const isExpoToken = (token) => Expo.isExpoPushToken(token);
export async function sendExpoPush(tokens, content, expo = client()) {
  const invalid = [];
  for (const chunk of expo.chunkPushNotifications(
    tokens.map((to) => ({ to, ...content, sound: 'default' })),
  )) {
    const tickets = await expo.sendPushNotificationsAsync(chunk);
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (ticket.status === 'ok')
        await prisma.pushReceipt.upsert({
          where: { id: ticket.id },
          create: { id: ticket.id, token: chunk[i].to },
          update: {},
        });
      else if (ticket.details?.error === 'DeviceNotRegistered')
        invalid.push(chunk[i].to);
      else console.error('[expo-push]', ticket.details?.error || 'rejected');
    }
  }
  return invalid;
}
export async function checkPushReceipts(expo = client()) {
  if (process.env.EXPO_PUSH_ENABLED !== 'true') return;
  const pending = await prisma.pushReceipt.findMany({
    where: { createdAt: { lte: new Date(Date.now() - 15 * 60000) } },
    orderBy: { createdAt: 'asc' },
    take: 1000,
  });
  for (const ids of expo.chunkPushNotificationReceiptIds(
    pending.map((p) => p.id),
  )) {
    const receipts = await expo.getPushNotificationReceiptsAsync(ids);
    for (const id of ids) {
      const receipt = receipts[id];
      const row = pending.find((p) => p.id === id);
      if (
        receipt?.status === 'error' &&
        receipt.details?.error === 'DeviceNotRegistered'
      )
        await prisma.deviceToken.deleteMany({ where: { token: row.token } });
      if (receipt || +row.createdAt < Date.now() - 24 * 3600000)
        await prisma.pushReceipt.deleteMany({ where: { id } });
    }
  }
}
