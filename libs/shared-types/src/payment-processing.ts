// Payment Processing Types
// Vendor-agnostic payment processing with multi-provider support

// No imports needed - all enums are defined in this file

// ============================================================================
// PAYMENT METHOD TYPES
// ============================================================================

export interface PaymentMethod {
  id: string;
  tenantId: string;
  type: PaymentMethodType;
  provider: PaymentProvider;
  details: PaymentMethodDetails;
  isDefault: boolean;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface PaymentMethodDetails {
  // For PromptPay
  promptPayId?: string;
  promptPayType?: PromptPayType;
  promptPayName?: string;

  // For Bank Transfer
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  branchCode?: string;

  // For Credit/Debit Cards
  last4?: string;
  brand?: CardBrand;
  expiryMonth?: number;
  expiryYear?: number;
  fingerprint?: string;
  funding?: CardFunding;
  country?: string;

  // For Digital Wallets
  walletType?: DigitalWalletType;
  walletId?: string;
  walletEmail?: string;

  // For Cryptocurrency
  cryptoType?: CryptocurrencyType;
  walletAddress?: string;
  network?: string;

  // Common fields
  displayName: string;
  nickname?: string;
  billingAddress?: BillingAddress;
  metadata?: Record<string, any>;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

// ============================================================================
// PAYMENT PROVIDER TYPES
// ============================================================================

export interface PaymentProvider {
  id: string;
  name: string;
  type: PaymentProviderType;
  status: ProviderStatus;
  supportedRegions: Region[];
  supportedCurrencies: Currency[];
  supportedMethods: PaymentMethodType[];
  configuration: ProviderConfiguration;
  fees: ProviderFeeStructure;
  capabilities: ProviderCapabilities;
  webhookEndpoint?: string;
  apiVersion?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderConfiguration {
  apiKey?: string;
  secretKey?: string;
  publicKey?: string;
  merchantId?: string;
  webhookSecret?: string;
  sandboxMode: boolean;
  customSettings?: Record<string, any>;
}

export interface ProviderFeeStructure {
  transactionFee: FeeStructure;
  subscriptionFee?: FeeStructure;
  refundFee?: FeeStructure;
  chargebackFee?: FeeStructure;
  currencyConversionFee?: FeeStructure;
}

export interface FeeStructure {
  type: FeeType;
  fixedAmount?: number;
  percentage?: number;
  minimumFee?: number;
  maximumFee?: number;
  currency: Currency;
}

export interface ProviderCapabilities {
  supportsRecurring: boolean;
  supportsRefunds: boolean;
  supportsPartialRefunds: boolean;
  supportsDisputes: boolean;
  supportsWebhooks: boolean;
  supportsInstantPayouts: boolean;
  supportsMultiCurrency: boolean;
  supportsTokenization: boolean;
  supports3DS: boolean;
  supportsPreAuth: boolean;
  maxRefundDays?: number;
  minTransactionAmount?: number;
  maxTransactionAmount?: number;
}

// ============================================================================
// PAYMENT REQUEST & RESPONSE TYPES
// ============================================================================

export interface PaymentRequest {
  tenantId: string;
  amount: number;
  currency: Currency;
  paymentMethodId: string;
  description?: string;
  statementDescriptor?: string;
  receiptEmail?: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
  captureMethod?: CaptureMethod;
  confirmationMethod?: ConfirmationMethod;
}

export interface PaymentResult {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: Currency;
  paymentMethodId: string;
  providerId: string;
  providerTransactionId?: string;
  fees?: PaymentFees;
  receiptUrl?: string;
  failureReason?: string;
  failureCode?: string;
  createdAt: Date;
  confirmedAt?: Date;
  metadata?: Record<string, any>;
}

export interface PaymentFees {
  processingFee: number;
  platformFee: number;
  totalFees: number;
  currency: Currency;
}

export interface PaymentIntent {
  id: string;
  tenantId: string;
  amount: number;
  currency: Currency;
  status: PaymentIntentStatus;
  paymentMethodId?: string;
  providerId: string;
  providerIntentId?: string;
  clientSecret?: string;
  nextAction?: PaymentNextAction;
  lastPaymentError?: PaymentError;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentNextAction {
  type: NextActionType;
  redirectToUrl?: RedirectAction;
  useStripeSdk?: boolean;
  displayBankTransferInstructions?: BankTransferInstructions;
  verifyWithMicrodeposits?: MicrodepositVerification;
}

export interface RedirectAction {
  returnUrl: string;
  url: string;
}

export interface BankTransferInstructions {
  accountNumber: string;
  routingNumber: string;
  accountName: string;
  bankName: string;
  reference: string;
  amount: number;
  currency: Currency;
}

export interface MicrodepositVerification {
  arrivalDate: Date;
  hostedVerificationUrl: string;
}

export interface PaymentError {
  code: string;
  message: string;
  type: PaymentErrorType;
  declineCode?: string;
  param?: string;
}

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export interface Subscription {
  id: string;
  tenantId: string;
  externalSubscriptionId?: string;
  planId: string;
  paymentProviderId: string;
  paymentMethodId?: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  canceledAt?: Date;
  cancelAtPeriodEnd: boolean;
  endedAt?: Date;
  usage: PaymentUsageMetrics;
  discount?: SubscriptionDiscount;
  tax?: SubscriptionTax;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionUpdate {
  planId?: string;
  paymentMethodId?: string;
  cancelAtPeriodEnd?: boolean;
  prorationBehavior?: ProrationBehavior;
  metadata?: Record<string, any>;
}

export interface SubscriptionDiscount {
  couponId: string;
  start: Date;
  end?: Date;
  percentOff?: number;
  amountOff?: number;
  currency?: Currency;
}

export interface SubscriptionTax {
  taxRateId: string;
  percentage: number;
  inclusive: boolean;
  displayName: string;
}

export interface PaymentUsageMetrics {
  activeCoaches: number;
  activeAthletes: number;
  storageUsed: number; // in bytes
  apiCalls: number;
  videoAnalysisMinutes: number;
  customMetrics?: Record<string, number>;
}

export interface UsageData {
  metricName: string;
  quantity: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface UsageReport {
  tenantId: string;
  period: BillingPeriod;
  metrics: PaymentUsageMetrics;
  breakdown: UsageBreakdown[];
  totalCost: number;
  currency: Currency;
  generatedAt: Date;
}

export interface UsageBreakdown {
  metricName: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  currency: Currency;
}

export interface BillingPeriod {
  start: Date;
  end: Date;
  type: BillingPeriodType;
}

// ============================================================================
// INVOICE TYPES
// ============================================================================

export interface Invoice {
  id: string;
  tenantId: string;
  subscriptionId?: string;
  number: string;
  status: InvoiceStatus;
  currency: Currency;
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  lineItems: InvoiceLineItem[];
  discount?: InvoiceDiscount;
  taxBreakdown?: TaxBreakdown[];
  paymentIntent?: string;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  dueDate?: Date;
  paidAt?: Date;
  voidedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
  currency: Currency;
  period?: BillingPeriod;
  proration: boolean;
  metadata?: Record<string, any>;
}

export interface InvoiceDiscount {
  couponId: string;
  amount: number;
  currency: Currency;
  description: string;
}

export interface TaxBreakdown {
  taxRateId: string;
  taxableAmount: number;
  taxAmount: number;
  rate: number;
  jurisdiction: string;
  type: TaxType;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  subscriptionId?: string;
  customerId?: string;
  dueDate?: DateRange;
  createdDate?: DateRange;
  limit?: number;
  offset?: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface PaymentWebhookData {
  id: string;
  type: WebhookEventType;
  providerId: string;
  data: WebhookEventData;
  signature: string;
  timestamp: Date;
  livemode: boolean;
}

export interface WebhookEventData {
  object: WebhookObject;
  previousAttributes?: Record<string, any>;
}

export interface WebhookObject {
  id: string;
  object: string;
  [key: string]: any;
}

export interface StripeWebhookData extends PaymentWebhookData {
  apiVersion: string;
  request?: {
    id: string;
    idempotencyKey?: string;
  };
}

// ============================================================================
// REFUND TYPES
// ============================================================================

export interface RefundRequest {
  paymentId: string;
  amount?: number;
  reason?: RefundReason;
  metadata?: Record<string, any>;
  refundApplicationFee?: boolean;
  reverseTransfer?: boolean;
}

export interface RefundResult {
  id: string;
  paymentId: string;
  amount: number;
  currency: Currency;
  status: RefundStatus;
  reason?: RefundReason;
  receiptNumber?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// ============================================================================
// DISPUTE TYPES
// ============================================================================

export interface Dispute {
  id: string;
  paymentId: string;
  amount: number;
  currency: Currency;
  reason: DisputeReason;
  status: DisputeStatus;
  evidence: DisputeEvidence;
  evidenceDueBy: Date;
  isChargeRefundable: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DisputeEvidence {
  accessActivityLog?: string;
  billingAddress?: string;
  cancellationPolicy?: string;
  cancellationPolicyDisclosure?: string;
  cancellationRebuttal?: string;
  customerCommunication?: string;
  customerEmailAddress?: string;
  customerName?: string;
  customerPurchaseIp?: string;
  customerSignature?: string;
  duplicateChargeDocumentation?: string;
  duplicateChargeExplanation?: string;
  duplicateChargeId?: string;
  productDescription?: string;
  receipt?: string;
  refundPolicy?: string;
  refundPolicyDisclosure?: string;
  refundRefusalExplanation?: string;
  serviceDate?: string;
  serviceDocumentation?: string;
  shippingAddress?: string;
  shippingCarrier?: string;
  shippingDate?: string;
  shippingDocumentation?: string;
  shippingTrackingNumber?: string;
  uncategorizedFile?: string;
  uncategorizedText?: string;
}

// ============================================================================
// ENUMS
// ============================================================================

export enum PaymentMethodType {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  PROMPTPAY = 'PROMPTPAY',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  CRYPTOCURRENCY = 'CRYPTOCURRENCY',
  CASH = 'CASH',
  CHECK = 'CHECK',
  WIRE_TRANSFER = 'WIRE_TRANSFER',
  ACH = 'ACH',
  SEPA = 'SEPA',
}

export enum PaymentProviderType {
  STRIPE = 'STRIPE',
  PROMPTPAY = 'PROMPTPAY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  OMISE = 'OMISE',
  PAYPAL = 'PAYPAL',
  SQUARE = 'SQUARE',
  ADYEN = 'ADYEN',
  BRAINTREE = 'BRAINTREE',
  RAZORPAY = 'RAZORPAY',
  CUSTOM = 'CUSTOM',
}

export enum PromptPayType {
  PHONE = 'PHONE',
  ID_CARD = 'ID_CARD',
  E_WALLET = 'E_WALLET',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
}

export enum CardBrand {
  VISA = 'VISA',
  MASTERCARD = 'MASTERCARD',
  AMERICAN_EXPRESS = 'AMERICAN_EXPRESS',
  DISCOVER = 'DISCOVER',
  JCB = 'JCB',
  DINERS_CLUB = 'DINERS_CLUB',
  UNIONPAY = 'UNIONPAY',
  UNKNOWN = 'UNKNOWN',
}

export enum CardFunding {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  PREPAID = 'PREPAID',
  UNKNOWN = 'UNKNOWN',
}

export enum DigitalWalletType {
  APPLE_PAY = 'APPLE_PAY',
  GOOGLE_PAY = 'GOOGLE_PAY',
  SAMSUNG_PAY = 'SAMSUNG_PAY',
  PAYPAL = 'PAYPAL',
  ALIPAY = 'ALIPAY',
  WECHAT_PAY = 'WECHAT_PAY',
  GRAB_PAY = 'GRAB_PAY',
  TRUE_MONEY = 'TRUE_MONEY',
}

export enum CryptocurrencyType {
  BITCOIN = 'BITCOIN',
  ETHEREUM = 'ETHEREUM',
  LITECOIN = 'LITECOIN',
  BITCOIN_CASH = 'BITCOIN_CASH',
  RIPPLE = 'RIPPLE',
  CARDANO = 'CARDANO',
  POLKADOT = 'POLKADOT',
  CHAINLINK = 'CHAINLINK',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  REQUIRES_ACTION = 'REQUIRES_ACTION',
  REQUIRES_CONFIRMATION = 'REQUIRES_CONFIRMATION',
  REQUIRES_PAYMENT_METHOD = 'REQUIRES_PAYMENT_METHOD',
}

export enum PaymentIntentStatus {
  REQUIRES_PAYMENT_METHOD = 'REQUIRES_PAYMENT_METHOD',
  REQUIRES_CONFIRMATION = 'REQUIRES_CONFIRMATION',
  REQUIRES_ACTION = 'REQUIRES_ACTION',
  PROCESSING = 'PROCESSING',
  REQUIRES_CAPTURE = 'REQUIRES_CAPTURE',
  CANCELED = 'CANCELED',
  SUCCEEDED = 'SUCCEEDED',
}

export enum SubscriptionStatus {
  INCOMPLETE = 'INCOMPLETE',
  INCOMPLETE_EXPIRED = 'INCOMPLETE_EXPIRED',
  TRIALING = 'TRIALING',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  UNPAID = 'UNPAID',
  PAUSED = 'PAUSED',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  PAID = 'PAID',
  UNCOLLECTIBLE = 'UNCOLLECTIBLE',
  VOID = 'VOID',
}

export enum RefundStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export enum RefundReason {
  DUPLICATE = 'DUPLICATE',
  FRAUDULENT = 'FRAUDULENT',
  REQUESTED_BY_CUSTOMER = 'REQUESTED_BY_CUSTOMER',
  EXPIRED_UNCAPTURED_CHARGE = 'EXPIRED_UNCAPTURED_CHARGE',
}

export enum DisputeReason {
  DUPLICATE = 'DUPLICATE',
  FRAUDULENT = 'FRAUDULENT',
  SUBSCRIPTION_CANCELED = 'SUBSCRIPTION_CANCELED',
  PRODUCT_UNACCEPTABLE = 'PRODUCT_UNACCEPTABLE',
  PRODUCT_NOT_RECEIVED = 'PRODUCT_NOT_RECEIVED',
  UNRECOGNIZED = 'UNRECOGNIZED',
  CREDIT_NOT_PROCESSED = 'CREDIT_NOT_PROCESSED',
  GENERAL = 'GENERAL',
  INCORRECT_ACCOUNT_DETAILS = 'INCORRECT_ACCOUNT_DETAILS',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  BANK_CANNOT_PROCESS = 'BANK_CANNOT_PROCESS',
  DEBIT_NOT_AUTHORIZED = 'DEBIT_NOT_AUTHORIZED',
  CUSTOMER_INITIATED = 'CUSTOMER_INITIATED',
}

export enum DisputeStatus {
  WARNING_NEEDS_RESPONSE = 'WARNING_NEEDS_RESPONSE',
  WARNING_UNDER_REVIEW = 'WARNING_UNDER_REVIEW',
  WARNING_CLOSED = 'WARNING_CLOSED',
  NEEDS_RESPONSE = 'NEEDS_RESPONSE',
  UNDER_REVIEW = 'UNDER_REVIEW',
  CHARGE_REFUNDED = 'CHARGE_REFUNDED',
  WON = 'WON',
  LOST = 'LOST',
}

export enum ProviderStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TESTING = 'TESTING',
  DEPRECATED = 'DEPRECATED',
  MAINTENANCE = 'MAINTENANCE',
}

export enum FeeType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
  TIERED = 'TIERED',
  VOLUME = 'VOLUME',
}

export enum CaptureMethod {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
}

export enum ConfirmationMethod {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
}

export enum NextActionType {
  REDIRECT_TO_URL = 'REDIRECT_TO_URL',
  USE_STRIPE_SDK = 'USE_STRIPE_SDK',
  DISPLAY_BANK_TRANSFER_INSTRUCTIONS = 'DISPLAY_BANK_TRANSFER_INSTRUCTIONS',
  VERIFY_WITH_MICRODEPOSITS = 'VERIFY_WITH_MICRODEPOSITS',
}

export enum PaymentErrorType {
  API_CONNECTION_ERROR = 'API_CONNECTION_ERROR',
  API_ERROR = 'API_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  CARD_ERROR = 'CARD_ERROR',
  IDEMPOTENCY_ERROR = 'IDEMPOTENCY_ERROR',
  INVALID_REQUEST_ERROR = 'INVALID_REQUEST_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
}

export enum ProrationBehavior {
  CREATE_PRORATIONS = 'CREATE_PRORATIONS',
  NONE = 'NONE',
  ALWAYS_INVOICE = 'ALWAYS_INVOICE',
}

export enum BillingPeriodType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

export enum TaxType {
  VAT = 'VAT',
  GST = 'GST',
  SALES_TAX = 'SALES_TAX',
  EXCISE_TAX = 'EXCISE_TAX',
  CUSTOMS_DUTY = 'CUSTOMS_DUTY',
}

export enum WebhookEventType {
  PAYMENT_INTENT_SUCCEEDED = 'PAYMENT_INTENT_SUCCEEDED',
  PAYMENT_INTENT_PAYMENT_FAILED = 'PAYMENT_INTENT_PAYMENT_FAILED',
  PAYMENT_INTENT_CANCELED = 'PAYMENT_INTENT_CANCELED',
  PAYMENT_METHOD_ATTACHED = 'PAYMENT_METHOD_ATTACHED',
  PAYMENT_METHOD_DETACHED = 'PAYMENT_METHOD_DETACHED',
  INVOICE_PAYMENT_SUCCEEDED = 'INVOICE_PAYMENT_SUCCEEDED',
  INVOICE_PAYMENT_FAILED = 'INVOICE_PAYMENT_FAILED',
  INVOICE_FINALIZED = 'INVOICE_FINALIZED',
  CUSTOMER_SUBSCRIPTION_CREATED = 'CUSTOMER_SUBSCRIPTION_CREATED',
  CUSTOMER_SUBSCRIPTION_UPDATED = 'CUSTOMER_SUBSCRIPTION_UPDATED',
  CUSTOMER_SUBSCRIPTION_DELETED = 'CUSTOMER_SUBSCRIPTION_DELETED',
  CUSTOMER_SUBSCRIPTION_TRIAL_WILL_END = 'CUSTOMER_SUBSCRIPTION_TRIAL_WILL_END',
  CHARGE_DISPUTE_CREATED = 'CHARGE_DISPUTE_CREATED',
  CHARGE_DISPUTE_UPDATED = 'CHARGE_DISPUTE_UPDATED',
  CHARGE_DISPUTE_CLOSED = 'CHARGE_DISPUTE_CLOSED',
}

export enum Currency {
  USD = 'USD',
  THB = 'THB',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CNY = 'CNY',
  KRW = 'KRW',
  AUD = 'AUD',
  CAD = 'CAD',
  SGD = 'SGD',
}

export enum Region {
  NORTH_AMERICA = 'NORTH_AMERICA',
  SOUTH_AMERICA = 'SOUTH_AMERICA',
  EUROPE = 'EUROPE',
  ASIA_PACIFIC = 'ASIA_PACIFIC',
  MIDDLE_EAST = 'MIDDLE_EAST',
  AFRICA = 'AFRICA',
  OCEANIA = 'OCEANIA',
}