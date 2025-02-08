import { BadRequestException } from '@nestjs/common';

export class TaskValidationException extends BadRequestException {
  constructor(message: string) {
    super({
      code: 'TASK_VALIDATION_ERROR',
      message,
    });
  }
}

export class TaskAssignmentException extends BadRequestException {
  constructor(message: string) {
    super({
      code: 'TASK_ASSIGNMENT_ERROR',
      message,
    });
  }
}

export class TaskStatusException extends BadRequestException {
  constructor(message: string) {
    super({
      code: 'TASK_STATUS_ERROR',
      message,
    });
  }
}
