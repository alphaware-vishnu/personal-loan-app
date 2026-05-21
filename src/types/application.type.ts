/**
 * Application & Offer type definitions
 */

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'CLOSED'
  | 'CANCELLED';

export interface Application {
  id: number;
  customerId: number;
  schemeMasterId: number;
  requestedAmount: number;
  disbursalAmount: number;
  emi: number;
  tenure: number;
  interest: number;
  repaymentFrequency: 'MONTHLY' | 'WEEKLY' | 'BI_WEEKLY';
  applicationStatus: ApplicationStatus;
  applicationSource?: string;
  applicationDocuments?: ApplicationDocument[];

  // Step completion tracking
  rulesEngineCompleted?: boolean;
  bankVerificationCompleted?: boolean;
  loanAgreementCompleted?: boolean;

  createdAt?: string;
  updatedAt?: string;
}

export interface ApplicationDocument {
  categoryId: number;
  documentTypeId: number;
  awsDocumentIds: string[];
  documentNumber: string | null;
}

export interface EmiCalculation {
  emi: number;
  disbursementAmount: number;
  totalInterest?: number;
  totalPayable?: number;
  repaymentSchedule?: RepaymentItem[];
}

export interface RepaymentItem {
  installmentNo: number;
  dueDate: string;
  principal: number;
  interest: number;
  emi: number;
  balance: number;
}
