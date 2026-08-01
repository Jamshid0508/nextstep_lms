export const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  BLOCKED: 'blocked',
  PENDING: 'pending',
});

export const BRANCH_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

export const COURSE_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

export const GROUP_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  COMPLETED: 'completed',
});

export const ATTENDANCE_STATUS = Object.freeze({
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
});

export const PAYMENT_TYPE = Object.freeze({
  MONTHLY: 'monthly',
  ONE_TIME: 'one_time',
  DISCOUNT: 'discount',
  PENALTY: 'penalty',
});

export const PAYMENT_METHOD = Object.freeze({
  CASH: 'cash',
  CARD: 'card',
  TRANSFER: 'transfer',
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
});

export const HOMEWORK_STATUS = Object.freeze({
  ACTIVE: 'active',
  CLOSED: 'closed',
});

export const SUBMISSION_STATUS = Object.freeze({
  NOT_SUBMITTED: 'not_submitted',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  LATE: 'late',
});

export const QUIZ_QUESTION_TYPE = Object.freeze({
  SINGLE: 'single',
  MULTIPLE: 'multiple',
  TRUE_FALSE: 'true_false',
  SHORT_ANSWER: 'short_answer',
});

export const QUIZ_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CLOSED: 'closed',
});

export const QUIZ_ATTEMPT_STATUS = Object.freeze({
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
});

export const NOTIFICATION_TYPE = Object.freeze({
  HOMEWORK_ASSIGNED: 'HOMEWORK_ASSIGNED',
  HOMEWORK_GRADED: 'HOMEWORK_GRADED',
  QUIZ_ASSIGNED: 'QUIZ_ASSIGNED',
  QUIZ_GRADED: 'QUIZ_GRADED',
  PAYMENT_DUE: 'PAYMENT_DUE',
  ATTENDANCE_MARKED: 'ATTENDANCE_MARKED',
  GENERAL: 'GENERAL',
});
