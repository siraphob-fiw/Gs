import { registerAs } from '@nestjs/config';

export interface EnvironmentConfig {
  nodeEnv: string;
  port: number;
  apiVersion: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isStaging: boolean;
}

export default registerAs('environment', (): EnvironmentConfig => {
  const nodeEnv = process.env.NODE_ENV || 'development';

  return {
    nodeEnv,
    port: parseInt(process.env.PORT || '3000', 10),
    apiVersion: process.env.API_VERSION || 'v1',
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
    isStaging: nodeEnv === 'staging',
  };
});
