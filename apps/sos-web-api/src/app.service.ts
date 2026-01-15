import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getAppInfo() {
    return {
      name: 'StrengthOS API',
      version: '1.0.0',
      description: 'NestJS-based REST API for the StrengthOS platform',
      status: 'running',
    };
  }
}
