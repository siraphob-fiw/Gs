import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { EmailService } from '../services/email.service';
import { EmailContent, EmailOptions } from '../interfaces/email.interface';
import { Public } from '@/auth/decorators/public.decorator';
import { ApiStandardOperation } from '@/common/decorators/swagger.decorators';
import { ApiBody } from '@nestjs/swagger/dist/decorators/api-body.decorator';

export class SendEmailDto {
  to: string;
  content: EmailContent;
  options?: EmailOptions;
}

export class SendBulkEmailDto {
  recipients: string[];
  content: EmailContent;
  options?: EmailOptions;
}

@Controller('email')
@Public()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiStandardOperation('Send email', 'Send an email to a recipient', false)
  @ApiBody({
    description: 'Send an email to a recipient',
    schema: {
      type: 'object',
      properties: {
        to: { type: 'string', example: 'test@example.com' },
        content: {
          type: 'object',
          properties: {
            subject: { type: 'string', example: 'Test email' },
            text: { type: 'string', example: 'This is a test email' },
            html: { type: 'string', example: '<p>This is a test email</p>' },
            templateId: { type: 'string', example: 'welcome-template' },
            templateData: {
              type: 'object',
              example: { username: 'John' },
              additionalProperties: true,
            },
          },
          required: ['subject'],
        },
        options: {
          type: 'object',
          properties: {
            replyTo: { type: 'string', example: 'test@example.com' },
            cc: {
              type: 'array',
              items: { type: 'string' },
              example: ['cc@example.com'],
            },
            bcc: {
              type: 'array',
              items: { type: 'string' },
              example: ['bcc@example.com'],
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              example: ['info'],
            },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high'],
              example: 'normal',
            },
          },
        },
      },
      required: ['to', 'content'],
      example: {
        to: 'test@example.com',
        content: {
          subject: 'Test email',
          text: 'This is a test email',
        },
        options: {
          replyTo: 'test@example.com',
        },
      },
    },
  })
  async sendEmail(@Body() sendEmailDto: any) {
    const result = await this.emailService.sendEmail(
      sendEmailDto.to,
      sendEmailDto.content,
      sendEmailDto.options,
    );

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      provider: result.provider,
      timestamp: result.timestamp,
    };
  }

  @Post('send-bulk')
  @HttpCode(HttpStatus.OK)
  async sendBulkEmail(@Body() sendBulkEmailDto: SendBulkEmailDto) {
    const results = await this.emailService.sendBulkEmail(
      sendBulkEmailDto.recipients,
      sendBulkEmailDto.content,
      sendBulkEmailDto.options,
    );

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    return {
      total: results.length,
      successful: successCount,
      failed: failureCount,
      results,
    };
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validateEmail(@Body() body: { email: string }) {
    const isValid = this.emailService.validateEmailAddress(body.email);

    return {
      email: body.email,
      valid: isValid,
    };
  }
}
