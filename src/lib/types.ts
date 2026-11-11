// TypeScript types for the activity management system

export type ActivityType =
  | "conference"
  | "scientific_day"
  | "discussion_session"
  | "workshop"
  | "seminar"
  | "fellowship";

export type Role = "practitioner" | "resident";
export type ParticipationType = "participation" | "attendance";
export type PaymentStatus = "pending" | "awaiting_approval" | "approved" | "rejected" | "failed" | "skipped";
export type PaymentMethod = "cash" | "card" | "transfer" | "syriatel";

export interface Specialty {
  id: string;
  name: string;
  slice: string;
  sliceName: string;
  isActive: boolean;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  typeName: string;
  location: string;
  governorate?: string | null;
  latitude: number;
  longitude: number;
  radius: number;
  startDate: string;
  endDate: string;
  daysCount: number;
  sessionsCount: number;
  timePeriod: string;
  hoursCount: number;
  cpdPoints: number;
  cpdPointsParticipation: number;
  cpdPointsResident: number;
  requiredCpdForCertificate: number;
  fee: number;
  residentFee: number;
  capacity: number;
  status: string;
  imageColor: string;
  featured: boolean;
  organizerName?: string | null;
  organizerLogo?: string | null;
  specialtyId?: string | null;
  supportingLogos?: string | null;
  createdAt: string;
  updatedAt: string;
  sessions?: Session[];
  specialty?: Specialty | null;
  _count?: { participants: number };
}

export interface Session {
  id: string;
  activityId: string;
  title: string;
  description?: string;
  day: number;
  startTime: string;
  endTime: string;
  status: string;
  hasCustomLocation?: boolean;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radius?: number | null;
  hasCustomCpd?: boolean;
  cpdPoints?: number;
  speaker?: string | null;
}

export interface Participant {
  id: string;
  nationalId: string;
  fullName: string;
  role: Role;
  participationType?: ParticipationType | null;
  activityId: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentRef?: string;
  paidAt?: string;
  registeredAt: string;
  createdAt: string;
  updatedAt: string;
  activity?: Activity;
  attendances?: Attendance[];
}

export interface Attendance {
  id: string;
  participantId: string;
  sessionId: string;
  verified: boolean;
  verifiedAt?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  cpdAwarded: number;
  createdAt: string;
  updatedAt: string;
  session?: Session;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  roleType: Role;
  participationType?: ParticipationType | null;
  certTitle: string;
  certSubtitle?: string | null;
  authorityLogo?: string | null;
  authorityName?: string | null;
  organizerLogo?: string | null;
  organizerName?: string | null;
  supportingLogos?: string | null;
  headerText?: string | null;
  bodyText: string;
  footerText?: string | null;
  signatureText?: string | null;
  signatureImage?: string | null;
  showCpdPoints: boolean;
  backgroundColor: string;
  borderColor: string;
  isActive: boolean;
}

// Flow: home → activity_detail → payment → attendance
export type ViewType =
  | "home"
  | "activity_detail"
  | "payment"
  | "attendance"
  | "doctor_portal";
