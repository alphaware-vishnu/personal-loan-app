/**
 * Validation schemas — centralized Yup schemas for all forms
 */

import * as Yup from 'yup';

/** PAN number validation */
export const panSchema = Yup.string()
  .length(10, 'PAN must be exactly 10 characters')
  .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g. ABCDE1234F)')
  .required('PAN number is required');

/** Mobile number validation */
export const mobileSchema = Yup.string()
  .length(10, 'Mobile number must be 10 digits')
  .matches(/^[6-9][0-9]{9}$/, 'Invalid mobile number')
  .required('Mobile number is required');

/** Name validation */
export const nameSchema = Yup.string()
  .min(3, 'Name must be at least 3 characters')
  .matches(/^[a-zA-Z\s]*$/, 'Special characters and numbers are not allowed')
  .required('Name is required');

/** Pincode validation */
export const pincodeSchema = Yup.string()
  .length(6, 'Pincode must be 6 digits')
  .matches(/^[1-9][0-9]{5}$/, 'Invalid pincode')
  .required('Pincode is required');

/** IFSC validation */
export const ifscSchema = Yup.string()
  .length(11, 'IFSC must be exactly 11 characters')
  .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format')
  .required('IFSC code is required');

/** Account number validation */
export const accountNumberSchema = Yup.string()
  .min(9, 'Account number must be at least 9 digits')
  .max(18, 'Account number is too long')
  .matches(/^[0-9]+$/, 'Only digits are allowed')
  .required('Account number is required');

/** Address schema */
export const addressSchema = Yup.object().shape({
  flatNo: Yup.string().min(1, 'Flat/House number is required').required('Required'),
  area: Yup.string().optional(),
  city: Yup.string().min(2, 'City name is too short').required('City is required'),
  stateName: Yup.string().min(2, 'State name is too short').required('State is required'),
  pinCode: pincodeSchema,
});

/** Bank details schema */
export const bankDetailsSchema = Yup.object().shape({
  accountName: nameSchema,
  accountNumber: accountNumberSchema,
  confirmAccountNumber: Yup.string()
    .oneOf([Yup.ref('accountNumber')], 'Account numbers do not match')
    .required('Confirm account number is required'),
  ifscCode: ifscSchema,
});