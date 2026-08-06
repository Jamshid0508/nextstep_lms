import { z } from 'zod';
import { ALL_ROLES } from '../constants/roles.js';
import {
  ATTENDANCE_STATUS,
  BRANCH_STATUS,
  COURSE_STATUS,
  GROUP_STATUS,
  HOMEWORK_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  PAYMENT_TYPE,
  QUIZ_QUESTION_TYPE,
  QUIZ_STATUS,
  SUBMISSION_STATUS,
  QUIZ_ATTEMPT_STATUS,
  USER_STATUS,
} from '../constants/status.js';

export const branchSchema = z.object({
  name: z.string().min(2, 'Filial nomi kamida 2 ta belgidan iborat bo’lishi kerak'),
  address: z.string().trim().optional().or(z.literal('')),
  phone: z.string().trim().optional().or(z.literal('')),
  status: z.enum(Object.values(BRANCH_STATUS)).optional(),
});

export const branchUpdateSchema = branchSchema.partial();

export const courseSchema = z.object({
  name: z.string().min(2, 'Kurs nomi kamida 2 ta belgidan iborat bo’lishi kerak'),
  description: z.string().trim().optional().or(z.literal('')),
  duration: z.number().int().min(1).optional(),
  price: z.number().min(0).optional(),
  status: z.enum(Object.values(COURSE_STATUS)).optional(),
});

export const courseUpdateSchema = courseSchema.partial();

export const groupSchema = z.object({
  name: z.string().min(2, 'Guruh nomi kamida 2 ta belgidan iborat bo’lishi kerak'),
  courseId: z.string().min(1, 'Kurs tanlanishi shart'),
  teacherId: z.string().min(1, 'O’qituvchi tanlanishi shart').optional().or(z.literal('')),
  branchId: z.string().min(1, 'Filial tanlanishi shart'),
  studentIds: z.array(z.string()).optional().default([]),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  room: z.string().trim().optional().or(z.literal('')),
  maxStudents: z.number().int().min(1).optional(),
  lessonDays: z.array(z.string()).optional().default([]),
  startTime: z.string().trim().optional().or(z.literal('')),
  endTime: z.string().trim().optional().or(z.literal('')),
  lessonTime: z.string().trim().optional().or(z.literal('')),
  status: z.enum(Object.values(GROUP_STATUS)).optional(),
});

export const groupUpdateSchema = groupSchema.partial();

export const scheduleSchema = z.object({
  groupId: z.string().min(1, 'Guruh tanlanishi shart'),
  teacherId: z.string().min(1, 'O’qituvchi tanlanishi shart').optional().or(z.literal('')),
  weekDays: z.array(z.string()).optional().default([]),
  startTime: z.string().min(1, 'Boshlanish vaqti shart'),
  endTime: z.string().min(1, 'Tugash vaqti shart'),
  startDate: z.coerce.date().optional(),
  lessonDuration: z.number().int().min(1).optional(),
  durationValue: z.number().int().min(1).optional(),
  durationUnit: z.enum(['week', 'month']).optional(),
  notes: z.string().trim().optional().or(z.literal('')),
});

export const scheduleUpdateSchema = scheduleSchema.partial();

export const attendanceSchema = z.object({
  groupId: z.string().min(1, 'Guruh tanlanishi shart'),
  lessonDate: z.coerce.date(),
  lessonStartTime: z.string().optional().or(z.literal('')),
  lessonEndTime: z.string().optional().or(z.literal('')),
  records: z.array(
    z.object({
      studentId: z.string().min(1, 'Talaba tanlanishi shart'),
      status: z.enum(Object.values(ATTENDANCE_STATUS)),
      note: z.string().trim().optional().or(z.literal('')),
    }),
  ),
  markedBy: z.string().min(1).optional().or(z.literal('')),
});

export const userSchema = z.object({
  fullName: z.string().min(2, 'F.I.Sh kamida 2 ta belgidan iborat bo’lishi kerak'),
  phone: z.string().trim().optional().or(z.literal('')),
  email: z.string().email('Email noto‘g‘ri').optional().or(z.literal('')),
  password: z.string().min(6, 'Parol kamida 6 belgidan iborat bo’lishi kerak'),
  role: z.enum(ALL_ROLES),
  studentType: z.enum(['restricted', 'paid']).optional(),
  status: z.enum(Object.values(USER_STATUS)).optional(),
  branchId: z.string().optional().or(z.literal('')),
  branchIds: z.array(z.string()).optional().default([]),
});

export const userUpdateSchema = userSchema.partial();

export const attendanceUpdateSchema = attendanceSchema.partial();

export const paymentSchema = z.object({
  studentId: z.string().min(1, 'Talaba tanlanishi shart'),
  groupId: z.string().min(1, 'Guruh tanlanishi shart'),
  amount: z.number().min(0),
  paymentDate: z.coerce.date().optional(),
  paymentType: z.enum(Object.values(PAYMENT_TYPE)),
  paymentMethod: z.enum(Object.values(PAYMENT_METHOD)).optional(),
  status: z.enum(Object.values(PAYMENT_STATUS)).optional(),
  dueDate: z.coerce.date().optional(),
  paidDate: z.coerce.date().optional(),
  note: z.string().trim().optional().or(z.literal('')),
  createdBy: z.string().min(1).optional().or(z.literal('')),
});

export const paymentUpdateSchema = paymentSchema.partial();

export const financeSchema = z.object({
  name: z.string().min(2, 'Sarlavha kamida 2 ta belgidan iborat bo’lishi kerak'),
  kind: z.enum(['expense', 'income']),
  category: z.enum(['manual', 'income', 'expense', 'teacher_salary', 'bonus', 'penalty', 'other']).optional(),
  amount: z.number().min(0),
  date: z.coerce.date(),
  description: z.string().trim().optional().or(z.literal('')),
  balance: z.number().min(0).optional(),
  teacherId: z.string().min(1).optional().or(z.literal('')),
  studentId: z.string().min(1).optional().or(z.literal('')),
  groupId: z.string().min(1).optional().or(z.literal('')),
  month: z.number().int().min(0).max(11).optional(),
  year: z.number().int().min(2020).optional(),
  reference: z.string().trim().optional().or(z.literal('')),
  recipient: z.string().trim().optional().or(z.literal('')),
  itemsReceived: z.string().trim().optional().or(z.literal('')),
  createdBy: z.string().min(1).optional().or(z.literal('')),
});

export const financeUpdateSchema = financeSchema.partial();

export const parentChildSchema = z.object({
  studentId: z.string().min(1, 'Talaba tanlanishi shart'),
  relationship: z.enum(['father', 'mother', 'guardian']).optional(),
});

export const homeworkSchema = z.object({
  groupId: z.string().min(1, 'Guruh tanlanishi shart'),
  teacherId: z.string().min(1, 'O’qituvchi tanlanishi shart'),
  title: z.string().min(2, 'Mavzu nomi kamida 2 ta belgidan iborat bo’lishi kerak'),
  description: z.string().trim().optional().or(z.literal('')),
  attachments: z.array(z.object({ name: z.string(), url: z.string().trim().optional().or(z.literal('')) })).optional().default([]),
  assignedDate: z.coerce.date().optional(),
  dueDate: z.coerce.date(),
  maxScore: z.number().int().min(1).optional(),
  status: z.enum(Object.values(HOMEWORK_STATUS)).optional(),
});

export const homeworkUpdateSchema = homeworkSchema.partial();

export const quizSchema = z.object({
  groupId: z.string().min(1, 'Guruh tanlanishi shart'),
  teacherId: z.string().min(1, 'O’qituvchi tanlanishi shart'),
  title: z.string().min(2, 'Test nomi kamida 2 ta belgidan iborat bo’lishi kerak'),
  description: z.string().trim().optional().or(z.literal('')),
  questions: z.array(
    z.object({
      text: z.string().min(1, 'Savol matni shart'),
      type: z.enum(Object.values(QUIZ_QUESTION_TYPE)),
      options: z.array(z.string()).optional().default([]),
      correctAnswers: z.array(z.number().int()).optional().default([]),
      points: z.number().int().min(1).optional(),
    }),
  ).optional().default([]),
  timeLimitMinutes: z.number().int().min(1).optional(),
  availableFrom: z.coerce.date().optional(),
  availableTo: z.coerce.date().optional(),
  attemptsAllowed: z.number().int().min(1).optional(),
  status: z.enum(Object.values(QUIZ_STATUS)).optional(),
});

export const quizUpdateSchema = quizSchema.partial();

export const teacherGradeHomeworkSchema = z.object({
  score: z.number().min(0).optional(),
  feedback: z.string().trim().optional().or(z.literal('')),
  status: z.enum(Object.values(SUBMISSION_STATUS)).optional(),
});

export const quizAttemptGradeSchema = z.object({
  score: z.number().min(0).optional(),
  status: z.enum(Object.values(QUIZ_ATTEMPT_STATUS)).optional(),
});

export const homeworkSubmissionSchema = z.object({
  submissionText: z.string().trim().optional().or(z.literal('')),
  attachments: z.array(z.object({ name: z.string(), url: z.string().trim().optional().or(z.literal('')) })).optional().default([]),
});

export const quizAnswerSchema = z.object({
  questionIndex: z.number().int().min(0),
  selectedOptions: z.array(z.number().int()).optional().default([]),
  textAnswer: z.string().trim().optional().or(z.literal('')),
});

export const quizAttemptSubmitSchema = z.object({
  answers: z.array(quizAnswerSchema),
});

export const settingSchema = z.object({
  organizationName: z.string().trim().optional().or(z.literal('')),
  logo: z.string().trim().optional().or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
  phone: z.string().trim().optional().or(z.literal('')),
  email: z.string().trim().optional().or(z.literal('')),
  website: z.string().trim().optional().or(z.literal('')),
  timezone: z.string().trim().optional().or(z.literal('')),
  currency: z.string().trim().optional().or(z.literal('')),
});

export const settingUpdateSchema = settingSchema.partial();
