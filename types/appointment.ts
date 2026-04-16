import { Timestamp } from 'firebase/firestore';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id:                   string;
  clientName:           string;
  clientPhone:          string;
  createdAt:            Timestamp;
  date:                 string;       // "YYYY-MM-DD"
  dateTime:             Timestamp;
  duration:             number;
  durationUnit:         string;
  googleCalendarEventId: string;
  serviceId:            string;
  serviceName:          string;
  status:               AppointmentStatus;
  time:                 string;       // "HH:MM"
  updatedAt:            Timestamp;
  userId:               string;
}
