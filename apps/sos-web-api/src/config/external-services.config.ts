import { registerAs } from '@nestjs/config';

export interface ExternalServicesConfig {
  sendgrid: {
    apiKey?: string;
    fromEmail: string;
    fromName: string;
  };
  stripe: {
    secretKey?: string;
    webhookSecret?: string;
    apiVersion: string;
  };
  aws: {
    accessKeyId?: string;
    secretAccessKey?: string;
    region: string;
    s3: {
      bucket: string;
      uploadsBucket: string;
    };
  };
  backup: {
    enabled: boolean;
    schedule: string;
    retentionDays: number;
    s3Bucket?: string;
  };
}

export default registerAs(
  'externalServices',
  (): ExternalServicesConfig => ({
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@strengthos.com',
      fromName: process.env.SENDGRID_FROM_NAME || 'StrengthOS',
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      apiVersion: '2023-10-16',
    },
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      s3: {
        bucket: process.env.AWS_S3_BUCKET || 'strengthos-uploads',
        uploadsBucket:
          process.env.AWS_S3_UPLOADS_BUCKET || 'strengthos-uploads',
      },
    },
    backup: {
      enabled: process.env.BACKUP_ENABLED === 'true',
      schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
      s3Bucket: process.env.BACKUP_S3_BUCKET,
    },
  }),
);
