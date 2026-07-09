import { User } from './user.type'

export type VerificationRequestStatus = 'pending' | 'approved' | 'rejected' | 'need_more_info'

export interface StudentVerificationRequest {
  id: string
  userId: string
  user?: User
  studentCode: string
  campus?: string | null
  personalEmail: string
  status: VerificationRequestStatus
  reviewedBy?: string | null
  reviewedAt?: string | null
  rejectionReason?: string | null
  createdAt: string
  updatedAt: string
}

export interface RegisterStudentRequest {
  email: string
  password: string
  fullName: string
  studentCode?: string
  campus?: string
  reasonForNoFptEmail?: string
}

export interface LoginRequest {
  email: string
  password?: string
}
