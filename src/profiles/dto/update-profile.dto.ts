import { IsOptional, IsString, MaxLength, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { Transform } from 'class-transformer';

// Custom date validator decorator
function IsDateString(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isDateString',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!value) return true; // Optional field
          const date = new Date(value);
          return !isNaN(date.getTime());
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid date string`;
        },
      },
    });
  };
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(511)
  @Transform(({ value }) => value?.trim())
  full_name?: string;

  @IsOptional()
  @IsDateString({ message: 'date_of_birth must be a valid date string' })
  @Transform(({ value }) => {
    if (!value) return value;
    // Try to parse the date and return it in YYYY-MM-DD format
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return value;
  })
  date_of_birth?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  bio?: string;
}
