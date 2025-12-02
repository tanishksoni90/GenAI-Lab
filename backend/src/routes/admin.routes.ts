import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// ==================== VALIDATION SCHEMAS ====================

const createStudentSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    name: z.string().min(2, 'Name too short'),
    registrationId: z.string().min(3, 'Registration ID too short'),
    courseId: z.string().optional(),
    batchId: z.string().optional(),
    tokenLimit: z.number().int().positive().optional(),
  }),
});

const updateStudentSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    courseId: z.string().nullable().optional(),
    batchId: z.string().nullable().optional(),
    tokenQuota: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  }),
});

const bulkOperationSchema = z.object({
  body: z.object({
    operation: z.enum(['update_status', 'update_tokens', 'reset_passwords', 'delete']),
    registrationIds: z.array(z.string()).min(1, 'At least one registration ID required'),
    value: z.any().optional(),
  }),
});

const importStudentsSchema = z.object({
  body: z.object({
    students: z.array(z.object({
      email: z.string().email(),
      name: z.string().min(2),
      registrationId: z.string().min(3),
    })).min(1),
    batchId: z.string().optional(),
  }),
});

const createCourseSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name too short'),
    description: z.string().optional(),
    instructor: z.string().optional(),
    duration: z.number().int().positive().optional(),
  }),
});

const createBatchSchema = z.object({
  body: z.object({
    courseId: z.string().min(1, 'Course ID required'),
    name: z.string().min(2, 'Name too short'),
  }),
});

const createGuardrailSchema = z.object({
  body: z.object({
    type: z.string().min(1),
    title: z.string().min(2),
    instruction: z.string().min(10),
    appliesTo: z.enum(['input', 'output', 'both']).optional(),
    priority: z.number().int().min(1).max(10).optional(),
  }),
});

const updateAPIKeySchema = z.object({
  body: z.object({
    apiKey: z.string().min(10, 'API key too short'),
    baseUrl: z.string().url().optional(),
  }),
});

const modelAccessSchema = z.object({
  body: z.object({
    modelId: z.string().uuid(),
    courseId: z.string().uuid().optional(),
    batchId: z.string().uuid().optional(),
    studentId: z.string().optional(),
  }),
});

// ==================== STUDENT ROUTES ====================

router.get('/students', adminController.getStudents);
router.get('/students/:id', adminController.getStudent);
router.post('/students', validate(createStudentSchema), adminController.createStudent);
router.put('/students/:id', validate(updateStudentSchema), adminController.updateStudent);
router.delete('/students/:id', adminController.deleteStudent);
router.post('/students/:id/reset-password', adminController.resetStudentPassword);
router.post('/students/bulk', validate(bulkOperationSchema), adminController.bulkOperation);
router.post('/students/import', validate(importStudentsSchema), adminController.importStudents);

// ==================== COURSE ROUTES ====================

router.get('/courses', adminController.getCourses);
router.post('/courses', validate(createCourseSchema), adminController.createCourse);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

// ==================== BATCH ROUTES ====================

router.get('/batches', adminController.getBatches);
router.post('/batches', validate(createBatchSchema), adminController.createBatch);
router.delete('/batches/:id', adminController.deleteBatch);

// ==================== ANALYTICS ====================

router.get('/analytics', adminController.getAnalytics);

// ==================== API KEYS ====================

router.get('/api-keys', adminController.getAPIKeys);
router.put('/api-keys/:provider', validate(updateAPIKeySchema), adminController.updateAPIKey);
router.post('/api-keys/:provider/test', adminController.testAPIKey);

// ==================== GUARDRAILS ====================

router.get('/guardrails', adminController.getGuardrails);
router.post('/guardrails', validate(createGuardrailSchema), adminController.createGuardrail);
router.put('/guardrails/:id', adminController.updateGuardrail);
router.delete('/guardrails/:id', adminController.deleteGuardrail);

// ==================== MODEL ACCESS ====================

router.get('/models/:modelId/access', adminController.getModelAccess);
router.post('/models/access', validate(modelAccessSchema), adminController.addModelAccess);
router.delete('/models/access/:id', adminController.removeModelAccess);

export default router;

