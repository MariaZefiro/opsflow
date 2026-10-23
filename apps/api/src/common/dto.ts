import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import {
  IncidentSeverity,
  IncidentStatus,
  ServiceType,
  TicketPriority,
  TicketStatus,
} from '@prisma/client';

export class RegisterDto {
  @IsString() @MinLength(2) companyName!: string;
  @IsString() @MinLength(2) name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(12) password!: string;
}
export class LoginDto {
  @IsString() companySlug!: string;
  @IsEmail() email!: string;
  @IsString() password!: string;
}
export class ForgotPasswordDto {
  @IsString() companySlug!: string;
  @IsEmail() email!: string;
}
export class ResetPasswordDto {
  @IsString() token!: string;
  @IsString() @MinLength(12) password!: string;
}
export class TicketDto {
  @IsString() @MinLength(3) title!: string;
  @IsString() description!: string;
  @IsString() category!: string;
  @IsOptional() @IsEnum(TicketPriority) priority?: TicketPriority;
  @IsOptional() @IsString() assigneeId?: string;
}
export class TicketUpdateDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(TicketPriority) priority?: TicketPriority;
  @IsOptional() @IsEnum(TicketStatus) status?: TicketStatus;
  @IsOptional() @IsString() assigneeId?: string;
}
export class CommentDto {
  @IsString() @MinLength(1) content!: string;
}
export class ServiceDto {
  @IsString() name!: string;
  @IsUrl({ require_tld: false }) url!: string;
  @IsEnum(ServiceType) type!: ServiceType;
  @IsOptional() @IsInt() @Min(5) checkInterval?: number;
  @IsOptional() @IsInt() @Min(1) @Max(120) timeout?: number;
  @IsOptional() @IsInt() @Min(100) @Max(599) expectedStatus?: number;
}
export class ServiceUpdateDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsUrl({ require_tld: false }) url?: string;
  @IsOptional() @IsEnum(ServiceType) type?: ServiceType;
  @IsOptional() @IsInt() @Min(5) checkInterval?: number;
  @IsOptional() @IsInt() @Min(1) @Max(120) timeout?: number;
  @IsOptional() @IsInt() @Min(100) @Max(599) expectedStatus?: number;
}
export class WebhookDto {
  @IsUrl({ require_tld: false }) url!: string;
  @IsArray() @ArrayNotEmpty() @IsString({ each: true }) events!: string[];
}
export class IncidentDto {
  @IsString() title!: string;
  @IsString() description!: string;
  @IsEnum(IncidentSeverity) severity!: IncidentSeverity;
  @IsOptional() @IsString() serviceId?: string;
  @IsOptional() @IsString() assigneeId?: string;
}
export class IncidentUpdateDto {
  @IsOptional() @IsEnum(IncidentStatus) status?: IncidentStatus;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() assigneeId?: string;
}
