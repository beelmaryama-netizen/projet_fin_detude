import { createMockClientServices } from './mockClientService';
import type { ClientServices } from '../types/client';
/** Single replacement point for future Axios / NestJS adapters. */
export const clientServices: ClientServices = createMockClientServices();
export const requestService = clientServices.requests;
export const quoteService = clientServices.quotes;
export const reservationService = clientServices.reservations;
export const addressService = clientServices.addresses;
export const notificationService = clientServices.notifications;
export const supportService = clientServices.support;
