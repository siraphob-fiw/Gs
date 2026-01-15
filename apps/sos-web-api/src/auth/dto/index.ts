export * from './auth-response.dto';
export * from './login.dto';
export * from './profile.dto';

// Re-export specific DTOs for convenience
export {
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  PhoneVerificationDto,
  PhoneVerificationConfirmDto,
  RegisterWithPhoneDto,
  AuthMethod,
} from './login.dto';
