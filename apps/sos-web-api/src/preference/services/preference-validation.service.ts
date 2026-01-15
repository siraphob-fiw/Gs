import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PreferenceRepository } from '../repositories/preference.repository';
import { PreferenceSchemaEntity } from '../entities/preference.entity';

@Injectable()
export class PreferenceValidationService {
  constructor(private readonly preferenceRepository: PreferenceRepository) {}

  async validatePreferenceValue(key: string, value: string): Promise<void> {
    const schema =
      await this.preferenceRepository.findPreferenceSchemaByKey(key);

    if (!schema) {
      // If no schema exists, allow any string value
      return;
    }

    this.validateAgainstSchema(value, schema);
  }

  async validatePreferenceUpdate(
    key: string,
    value: string,
    _userId: string,
  ): Promise<void> {
    const schema =
      await this.preferenceRepository.findPreferenceSchemaByKey(key);

    if (schema && !schema.isUserEditable) {
      throw new BadRequestException(`Preference '${key}' is not user-editable`);
    }

    if (schema) {
      this.validateAgainstSchema(value, schema);
    }
  }

  private validateAgainstSchema(
    value: string,
    schema: PreferenceSchemaEntity,
  ): void {
    // Type validation
    switch (schema.dataType) {
      case 'number':
        this.validateNumber(value, schema);
        break;
      case 'boolean':
        this.validateBoolean(value, schema);
        break;
      case 'json':
        this.validateJson(value, schema);
        break;
      case 'array':
        this.validateArray(value, schema);
        break;
      case 'string':
      default:
        this.validateString(value, schema);
        break;
    }

    // Custom validation rules
    if (schema.validationRules) {
      this.validateCustomRules(value, schema.validationRules, schema.dataType);
    }
  }

  private validateNumber(value: string, schema: PreferenceSchemaEntity): void {
    const numValue = Number(value);

    if (isNaN(numValue)) {
      throw new BadRequestException(
        `Preference '${schema.key}' must be a valid number`,
      );
    }

    if (schema.validationRules) {
      const rules = schema.validationRules;

      if (rules.min !== undefined && numValue < rules.min) {
        throw new BadRequestException(
          `Preference '${schema.key}' must be at least ${rules.min}`,
        );
      }

      if (rules.max !== undefined && numValue > rules.max) {
        throw new BadRequestException(
          `Preference '${schema.key}' must be at most ${rules.max}`,
        );
      }

      if (rules.integer === true && !Number.isInteger(numValue)) {
        throw new BadRequestException(
          `Preference '${schema.key}' must be an integer`,
        );
      }
    }
  }

  private validateBoolean(value: string, schema: PreferenceSchemaEntity): void {
    const lowerValue = value.toLowerCase();
    const validBooleans = ['true', 'false', '1', '0', 'yes', 'no'];

    if (!validBooleans.includes(lowerValue)) {
      throw new BadRequestException(
        `Preference '${schema.key}' must be a valid boolean value (true/false, 1/0, yes/no)`,
      );
    }
  }

  private validateJson(value: string, schema: PreferenceSchemaEntity): void {
    try {
      const parsed = JSON.parse(value);

      if (schema.validationRules?.requiredKeys) {
        const requiredKeys = schema.validationRules.requiredKeys as string[];
        const missingKeys = requiredKeys.filter((key) => !(key in parsed));

        if (missingKeys.length > 0) {
          throw new BadRequestException(
            `Preference '${schema.key}' is missing required keys: ${missingKeys.join(', ')}`,
          );
        }
      }
    } catch (error) {
      Logger.error({
        message: 'Failed to validate JSON',
        fullMessage: (error as Error).message,
      });
      throw new BadRequestException(
        `Preference '${schema.key}' must be valid JSON`,
      );
    }
  }

  private validateArray(value: string, schema: PreferenceSchemaEntity): void {
    try {
      const parsed = JSON.parse(value);

      if (!Array.isArray(parsed)) {
        throw new BadRequestException(
          `Preference '${schema.key}' must be a valid array`,
        );
      }

      if (schema.validationRules) {
        const rules = schema.validationRules;

        if (rules.minLength !== undefined && parsed.length < rules.minLength) {
          throw new BadRequestException(
            `Preference '${schema.key}' must have at least ${rules.minLength} items`,
          );
        }

        if (rules.maxLength !== undefined && parsed.length > rules.maxLength) {
          throw new BadRequestException(
            `Preference '${schema.key}' must have at most ${rules.maxLength} items`,
          );
        }

        if (rules.itemType) {
          const invalidItems = parsed.filter(
            (item) => typeof item !== rules.itemType,
          );
          if (invalidItems.length > 0) {
            throw new BadRequestException(
              `Preference '${schema.key}' must contain only ${rules.itemType} values`,
            );
          }
        }
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Preference '${schema.key}' must be a valid JSON array`,
      );
    }
  }

  private validateString(value: string, schema: PreferenceSchemaEntity): void {
    if (schema.validationRules) {
      const rules = schema.validationRules;

      if (rules.minLength !== undefined && value.length < rules.minLength) {
        throw new BadRequestException(
          `Preference '${schema.key}' must be at least ${rules.minLength} characters`,
        );
      }

      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        throw new BadRequestException(
          `Preference '${schema.key}' must be at most ${rules.maxLength} characters`,
        );
      }

      if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
        throw new BadRequestException(
          `Preference '${schema.key}' does not match required pattern`,
        );
      }

      if (rules.enum && !rules.enum.includes(value)) {
        throw new BadRequestException(
          `Preference '${schema.key}' must be one of: ${rules.enum.join(', ')}`,
        );
      }
    }
  }

  private validateCustomRules(
    value: string,
    rules: Record<string, any>,
    _dataType: string,
  ): void {
    // Additional custom validation logic can be added here
    // This is a placeholder for more complex validation scenarios

    if (rules.custom) {
      // Example: custom validation function names
      switch (rules.custom) {
        case 'email':
          this.validateEmail(value);
          break;
        case 'url':
          this.validateUrl(value);
          break;
        case 'phone':
          this.validatePhone(value);
          break;
        default:
          // Unknown custom validation - skip
          break;
      }
    }
  }

  private validateEmail(value: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new BadRequestException('Value must be a valid email address');
    }
  }

  private validateUrl(value: string): void {
    try {
      new URL(value);
    } catch {
      throw new BadRequestException('Value must be a valid URL');
    }
  }

  private validatePhone(value: string): void {
    // Simple phone validation - can be enhanced based on requirements
    const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
    if (!phoneRegex.test(value)) {
      throw new BadRequestException('Value must be a valid phone number');
    }
  }

  async getDefaultValue(key: string): Promise<string | null> {
    const schema =
      await this.preferenceRepository.findPreferenceSchemaByKey(key);
    return schema?.defaultValue || null;
  }

  async isPreferenceRequired(key: string): Promise<boolean> {
    const schema =
      await this.preferenceRepository.findPreferenceSchemaByKey(key);
    return schema?.isRequired || false;
  }

  async isPreferenceUserEditable(key: string): Promise<boolean> {
    const schema =
      await this.preferenceRepository.findPreferenceSchemaByKey(key);
    return schema?.isUserEditable !== false; // Default to true if not specified
  }
}
