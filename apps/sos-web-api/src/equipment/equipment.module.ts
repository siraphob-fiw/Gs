import { Module } from '@nestjs/common';
import { EquipmentController } from './controllers/equipment.controller';
import { EquipmentService } from './services/equipment.service';
import { EquipmentRepository } from './repositories/equipment.repository';
import { SharedModule } from '../shared/shared.module';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [SharedModule, DatabaseModule],
    controllers: [EquipmentController],
    providers: [EquipmentService, EquipmentRepository],
    exports: [EquipmentService, EquipmentRepository],
})
export class EquipmentModule { }
