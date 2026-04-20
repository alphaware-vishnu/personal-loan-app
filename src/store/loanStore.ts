import { create } from 'zustand';

export interface DocumentType {
  id: number;
  documentName: string;
  description: string;
  acceptedFormats: string;
  isRequired: boolean;
  maxSizeMb: number;
}

export interface DocumentRequirement {
  id: number;
  categoryId: number;
  categoryName: string;
  availableDocumentTypes: DocumentType[];
}

export interface ApplicationDocument {
  categoryId: number;
  documentTypeId: number;
  awsDocumentIds: string[];
  documentNumber: string | null;
}

export interface CustomerBank {
  accountHolderName: string;
  accountNo: string;
  bank: string;
  branch: string;
  ifsc: string;
  accountType: 'SAVINGS' | 'CURRENT';
  isDefault: boolean;
}

export interface CustomerInfo {
  applicantName: string;
  mobileNumber: string;
  voterId: string;
  customerBanks: CustomerBank[];
}

export interface LoanApplicationState {
  // Payload fields
  requestedAmount: number;
  disbursalAmount: number;
  emi: number;
  tenure: number;
  interest: number;
  schemeMasterId: number | null;
  repaymentFrequency: string;
  customerId: number | null;
  applicationDocuments: ApplicationDocument[];

  // Customer Data
  customerInfo: CustomerInfo;

  // Dynamic Doc Requirements
  documentRequirements: DocumentRequirement[];
  // Mapping of documentTypeId -> { uri, awsId }
  uploadedDocs: Record<number, { uri: string; awsId: string; documentNumber?: string }>;

  isExistingCustomer: boolean;

  // Actions
  setScheme: (scheme: any) => void;
  setCalculationResults: (emi: number, disbursalAmount: number) => void;
  setDocumentRequirements: (requirements: DocumentRequirement[]) => void;
  updateUploadedDoc: (typeId: number, data: { uri: string; awsId: string; documentNumber?: string }) => void;
  clearUploadedDocs: () => void;
  addDocument: (doc: ApplicationDocument) => void;
  setCustomerInfo: (info: Partial<CustomerInfo>) => void;
  addCustomerBank: (bank: CustomerBank) => void;
  hydrateCustomerData: (data: any) => void;
  setCustomerId: (id: number) => void;
  reset: () => void;
}

const initialCustomerInfo: CustomerInfo = {
  applicantName: '',
  mobileNumber: '',
  voterId: '',
  customerBanks: [],
};

export const useLoanStore = create<LoanApplicationState>((set) => ({
  requestedAmount: 0,
  disbursalAmount: 0,
  emi: 0,
  tenure: 0,
  interest: 0,
  schemeMasterId: null,
  repaymentFrequency: 'MONTHLY',
  customerId: null,
  applicationDocuments: [],
  customerInfo: initialCustomerInfo,
  documentRequirements: [],
  uploadedDocs: {},
  isExistingCustomer: false,

  setScheme: (scheme) => set({
    schemeMasterId: scheme.id,
    requestedAmount: scheme.loanAmount,
    tenure: scheme.defaultTenure,
    interest: scheme.defaultInterest,
    repaymentFrequency: scheme.tenureFrequency || 'MONTHLY',
  }),

  setCalculationResults: (emi, disbursalAmount) => set({
    emi,
    disbursalAmount,
  }),

  setDocumentRequirements: (requirements) => set({
    documentRequirements: requirements
  }),

  updateUploadedDoc: (typeId, data) => set((state) => ({
    uploadedDocs: {
      ...state.uploadedDocs,
      [typeId]: data
    }
  })),

  clearUploadedDocs: () => set({ uploadedDocs: {} }),

  addDocument: (doc) => set((state) => {
    // Avoid duplicate document entries for the same type
    const filteredDocs = state.applicationDocuments.filter(
      d => d.documentTypeId !== doc.documentTypeId
    );
    return { applicationDocuments: [...filteredDocs, doc] };
  }),

  setCustomerInfo: (info) => set((state) => ({
    customerInfo: { ...state.customerInfo, ...info }
  })),

  addCustomerBank: (bank) => set((state) => ({
    customerInfo: {
      ...state.customerInfo,
      customerBanks: [bank] // User typically adds one for now, or we can use spread if multiple allowed
    }
  })),

  hydrateCustomerData: (data) => set({
    isExistingCustomer: true,
    customerId: data.id,
    customerInfo: {
      applicantName: data.applicantName || '',
      mobileNumber: data.mobileNumber || '',
      voterId: data.voterId || '',
      customerBanks: data.customerBanks || [],
    }
  }),

  setCustomerId: (id) => set({ customerId: id }),

  reset: () => set({
    requestedAmount: 0,
    disbursalAmount: 0,
    emi: 0,
    tenure: 0,
    interest: 0,
    schemeMasterId: null,
    repaymentFrequency: 'MONTHLY',
    customerId: null,
    applicationDocuments: [],
    customerInfo: initialCustomerInfo,
    documentRequirements: [],
    uploadedDocs: {},
    isExistingCustomer: false,
  }),
}));
