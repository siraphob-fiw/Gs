import { Module, Global } from '@nestjs/common';
import { TypeTransformationService } from './services/type-transformation.service';
import { DataManipulationService } from './services/data-manipulation.service';
import { EntityMappingService } from './services/entity-mapping.service';

@Global()
@Module({
  providers: [
    TypeTransformationService,
    DataManipulationService,
    EntityMappingService,
  ],
  exports: [
    TypeTransformationService,
    DataManipulationService,
    EntityMappingService,
  ],
})
export class TypesModule {}
