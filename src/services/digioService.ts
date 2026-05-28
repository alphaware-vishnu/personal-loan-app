/**
 * Digio eSign & eStamp Service
 * 
 * Handles:
 * - SDK initialization and configuration
 * - Backend API calls for creating/tracking eSign requests
 * - SDK gateway flow orchestration
 * - Gateway event handling
 */

import { NativeModules } from 'react-native';
import { Digio, DigioConfig, Environment, ServiceMode, GatewayEvent } from '@digiotech/react-native';
import { api } from '../api/client';
import { env } from '../config/env';

/**
 * Check if the native Digio SDK module is linked and available in the current runtime
 */
export const isDigioSdkSupported = (): boolean => {
  return !!NativeModules.DigioReactNative;
};

// ─── Types ───────────────────────────────────────────────────

/** Response from backend after initiating eSign */
export interface EsignInitiateResponse {
  docId: string;
  signingLink: string;
}

/** Status response from backend for eSign */
export interface EsignStatusResponse {
  code: string;
  model: {
    docId: string;
    status: string;
    url: string;
  };
}

/** Result returned after SDK gateway flow completes */
export interface DigioResult {
  success: boolean;
  documentId: string;
  message?: string;
}

/** Gateway event callback type */
export type GatewayEventCallback = (event: GatewayEvent) => void;

// ─── Backend API Calls ───────────────────────────────────────

/**
 * Initiate an eSign request for an application via the backend.
 * POST /application/{id}/esign/initiate
 */
export const initiateESign = async (applicationId: number): Promise<EsignInitiateResponse> => {
  const response = await api.post(`/application/${applicationId}/esign/initiate`);
  return response.data?.data;
};

/**
 * Check/Refresh the eSign status for an application.
 * GET /application/{id}/esign/status
 */
export const refreshESignStatus = async (applicationId: number): Promise<EsignStatusResponse> => {
  const response = await api.get(`/application/${applicationId}/esign/status`);
  return response.data?.data;
};

// ─── SDK Initialization & Flow ───────────────────────────────

/**
 * Create and configure the Digio SDK instance.
 * Uses environment config from env.ts for environment, logo, and theming.
 */
export const createDigioInstance = (): Digio => {
  const config: DigioConfig = {
    environment: env.digioEnvironment === 'PRODUCTION'
      ? Environment.PRODUCTION
      : Environment.SANDBOX,
    serviceMode: ServiceMode.OTP,  // Aadhaar OTP-based signing
    logo: env.digioLogoUrl,
    theme: {
      primaryColor: env.digioThemePrimaryColor,
      secondaryColor: env.digioThemeSecondaryColor,
    },
  };

  return new Digio(config);
};

/**
 * Start the eSign flow via SDK gateway.
 * Opens the Digio native gateway UI for:
 *   1. eStamp paper procurement (if configured)
 *   2. Aadhaar number entry
 *   3. OTP verification
 *   4. Document signing
 * 
 * @param digio - The Digio SDK instance (from createDigioInstance)
 * @param documentId - The document ID from createEsignRequest response
 * @param identifier - The signer's email or mobile (must match what was sent in request)
 * @returns DigioResult with success/failure status
 */
export const startEsignFlow = async (
  digio: Digio,
  documentId: string,
  identifier: string,
): Promise<DigioResult> => {
  try {
    const response = await digio.start(documentId, identifier);
    return {
      success: true,
      documentId,
      message: 'Document signed successfully',
    };
  } catch (error: any) {
    // SDK throws on cancellation or failure
    const errorMessage = error?.message || 'eSign process failed or was cancelled by user';

    if (env.enableDebugTools) {
      console.error('[DigioService] eSign flow error:', error);
    }

    return {
      success: false,
      documentId,
      message: errorMessage,
    };
  }
};
