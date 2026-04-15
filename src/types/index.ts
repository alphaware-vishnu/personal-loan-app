/**
 * App-wide type declarations
 */

// Lottie animation source type
export type LottieSource = string | { uri: string } | object;

// Common navigation param types (extend as needed)
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  LoanApplication: undefined;
  LoanDetails: { loanId: string };
  Profile: undefined;
};

// Theme types
export interface AppTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  };
}
