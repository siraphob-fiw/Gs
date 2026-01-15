import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './services/email.service';
import { EmailProviderFactory } from './providers/email-provider.factory';
import { EmailController } from './controllers/email.controller';
import emailConfig from './config/email.config';
import {
  IEmailProvider,
  EmailProviderConfig,
} from './interfaces/email.interface';
import { DatabaseModule } from '@/database/database.module';
import { DatabaseService } from '@/database/database.service';

// Provider factory that creates the appropriate email provider
const emailProviderFactory = {
  provide: 'EMAIL_PROVIDER',
  useFactory: (
    configService: ConfigService,
    emailProviderFactory: EmailProviderFactory,
  ): IEmailProvider => {
    const config: EmailProviderConfig = configService.get('email');
    return emailProviderFactory.createProvider(config);
  },
  inject: [ConfigService, EmailProviderFactory],
};

@Module({
  imports: [ConfigModule.forFeature(emailConfig), DatabaseModule],
  providers: [
    EmailService,
    EmailProviderFactory,
    emailProviderFactory,
    DatabaseService,
  ],
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule {}
