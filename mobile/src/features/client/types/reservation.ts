export interface ClientReservation {
  id: string;
  status: 'CONFIRMED';
  startAt: string;
  endAt: string;
  timeZone: string;
  serviceTitle: string;
  address: string;
}
