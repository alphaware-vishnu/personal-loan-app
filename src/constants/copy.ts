/**
 * User-facing copy — friendly, non-banking language
 * All text is centralized here for easy i18n and remote override.
 */

export const COPY = {
  // ─── App ───
  appName: 'FinEase',
  appTagline: 'Smart finance, simplified.',

  // ─── Onboarding Carousel ───
  onboarding: {
    slides: [
      {
        title: 'Instant Approvals',
        subtitle: 'No branch visits needed',
        description: 'Get your eligibility checked in under 2 minutes — all from your phone.',
      },
      {
        title: '100% Digital',
        subtitle: 'Everything on your phone',
        description: 'Complete your entire setup digitally. No paperwork, no queues.',
      },
      {
        title: 'Flexible Repayment',
        subtitle: 'Choose what works for you',
        description: 'Pick your repayment schedule and manage everything from the app.',
      },
      {
        title: 'Bank-Grade Security',
        subtitle: 'Your data is encrypted',
        description: 'We use 256-bit encryption and never share your data without consent.',
      },
      {
        title: 'Money in Minutes',
        subtitle: 'Fast disbursal to your account',
        description: 'Once approved, funds are transferred directly to your bank account.',
      },
    ],
    getStarted: 'Get Started',
    next: 'Continue',
    skip: 'Skip for now',
  },

  // ─── Permissions ───
  permissions: {
    sms: {
      title: 'SMS Access',
      subtitle: 'Auto-read your OTP',
      description: 'We use SMS access to automatically read your verification code — so you don\'t have to type it manually.',
    },
    location: {
      title: 'Location Services',
      subtitle: 'Auto-fill your address',
      description: 'We use your location to automatically fill your address and speed up the verification process.',
    },
    camera: {
      title: 'Camera Access',
      subtitle: 'Quick document capture',
      description: 'Camera access is needed for capturing clear photos of your ID documents and selfie during the secure verification.',
    },
    title: 'Let\'s set you up',
    subtitle: 'Provide the permissions below to ensure a smooth and automated onboarding process.',
    allowAll: 'Allow Permissions',
    maybeLater: 'Maybe later',
  },

  // ─── Auth ───
  auth: {
    mobileTitle: 'Enter your mobile number',
    mobileSubtitle: 'We\'ll send a 6-digit code to verify your account.',
    mobilePlaceholder: '98765 43210',
    mobileCta: 'Send Verification Code',
    otpTitle: 'Verify your number',
    otpSubtitle: 'Enter the 6-digit code sent to',
    otpResend: 'Resend code',
    otpResendActive: 'Resend code in {seconds}s',
    otpVerifyCta: 'Verify & Continue',
  },

  // ─── PAN Verification ───
  pan: {
    title: 'Let\'s verify your identity',
    subtitle: 'Enter your PAN to quickly retrieve and verify your profile details.',
    placeholder: 'ABCDE1234F',
    cta: 'Verify PAN',
    errorInvalid: 'Please enter a valid 10-character PAN',
    successTitle: 'Identity Verified!',
    nameLabel: 'Full Name',
    dobLabel: 'Date of Birth',
    genderLabel: 'Gender',
  },

  // ─── Employment ───
  employment: {
    title: 'Help us understand your work',
    subtitle: 'This helps us find the best loan terms tailored to your profession.',
    salaried: 'Salaried',
    salariedDesc: 'Regular monthly salary credited to bank',
    selfEmployed: 'Self-Employed',
    selfEmployedDesc: 'Independent contractor, business owner or consultant',
    freelancer: 'Freelancer',
    freelancerDesc: 'Project-based work or gig economy professional',
    student: 'Student / Other',
    studentDesc: 'Currently studying or other situations',
    cta: 'Continue',
  },

  // ─── Address ───
  address: {
    workTitle: 'Work Address',
    workSubtitle: 'Where do you work? We\'ll auto-populate this using location.',
    personalTitle: 'Home Address',
    personalSubtitle: 'Where do you live? Enter your flat number, rest is auto-populated.',
    flatNoPlaceholder: 'Flat / House No. / Building Name',
    areaPlaceholder: 'Area / Locality / Sector',
    cityPlaceholder: 'City',
    statePlaceholder: 'State',
    pincodePlaceholder: 'Pincode',
    sameAsWork: 'My home address is same as work address',
    gpsFetchSuccess: 'Location detected successfully',
    gpsFetchError: 'Could not fetch GPS location. Please type manually.',
    cta: 'Continue',
  },

  // ─── Profile Completion ───
  completion: {
    title: 'Great progress!',
    subtitle: 'Your basic profile is set up. Let\'s continue to check your loan eligibility.',
    progressLabel: 'Profile completed',
    cta: 'Check Eligibility',
  },
};