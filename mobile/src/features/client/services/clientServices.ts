import { apiMode } from '../../../services/api/config';
import { apiClientServices } from './apiClientService';
import { createMockClientServices } from './mockClientService';
import type { ClientServices } from '../types/client';
/** Single replacement point for future Axios / NestJS adapters. */
const demoServices = createMockClientServices();
export const clientServices = apiMode ? { ...demoServices, ...apiClientServices } : demoServices;
export const requestService = clientServices.requests;
export const quoteService = clientServices.quotes;
export const reservationService = clientServices.reservations;
export const addressService = clientServices.addresses;
export const notificationService = clientServices.notifications;
export const supportService = clientServices.support;
