import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/admin.service';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../utils/response';

// ==================== STUDENT MANAGEMENT ====================

export const getStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const courseId = req.query.courseId as string | undefined;
    const batchId = req.query.batchId as string | undefined;
    const search = req.query.search as string | undefined;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const result = await adminService.getStudents({ page, limit, courseId, batchId, search, isActive });
    return sendPaginated(res, result.students, result.page, result.limit, result.total);
  } catch (error) {
    next(error);
  }
};

export const getStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await adminService.getStudent(req.params.id);
    return sendSuccess(res, { student });
  } catch (error) {
    next(error);
  }
};

export const createStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.createStudent(req.body);
    return sendCreated(res, result, 'Student created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await adminService.updateStudent(req.params.id, req.body);
    return sendSuccess(res, { student }, 'Student updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const permanent = req.query.permanent === 'true';
    const result = await adminService.deleteStudent(req.params.id, permanent);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const resetStudentPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.resetStudentPassword(req.params.id);
    return sendSuccess(res, result, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

export const bulkOperation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.bulkOperation(req.body);
    return sendSuccess(res, result, 'Bulk operation completed');
  } catch (error) {
    next(error);
  }
};

export const importStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { students, batchId } = req.body;
    const result = await adminService.importStudents(students, batchId);
    return sendSuccess(res, result, 'Import completed');
  } catch (error) {
    next(error);
  }
};

// ==================== COURSE MANAGEMENT ====================

export const getCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await adminService.getCourses();
    return sendSuccess(res, { courses });
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await adminService.createCourse(req.body);
    return sendCreated(res, { course }, 'Course created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await adminService.updateCourse(req.params.id, req.body);
    return sendSuccess(res, { course }, 'Course updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.deleteCourse(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// ==================== BATCH MANAGEMENT ====================

export const getBatches = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = req.query.courseId as string | undefined;
    const batches = await adminService.getBatches(courseId);
    return sendSuccess(res, { batches });
  } catch (error) {
    next(error);
  }
};

export const createBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, name } = req.body;
    const batch = await adminService.createBatch(courseId, name);
    return sendCreated(res, { batch }, 'Batch created successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.deleteBatch(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// ==================== ANALYTICS ====================

export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await adminService.getAnalytics();
    return sendSuccess(res, analytics);
  } catch (error) {
    next(error);
  }
};

// ==================== API KEYS ====================

export const getAPIKeys = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keys = await adminService.getAPIKeys();
    return sendSuccess(res, { keys });
  } catch (error) {
    next(error);
  }
};

export const updateAPIKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider } = req.params;
    const { apiKey, baseUrl } = req.body;
    const key = await adminService.updateAPIKey(provider, apiKey, baseUrl);
    return sendSuccess(res, { key }, 'API key updated successfully');
  } catch (error) {
    next(error);
  }
};

export const testAPIKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider } = req.params;
    const result = await adminService.testAPIKey(provider);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const deleteAPIKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider } = req.params;
    const result = await adminService.deleteAPIKey(provider);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// ==================== GUARDRAILS ====================

export const getGuardrails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guardrails = await adminService.getGuardrails();
    return sendSuccess(res, { guardrails });
  } catch (error) {
    next(error);
  }
};

export const createGuardrail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guardrail = await adminService.createGuardrail(req.body);
    return sendCreated(res, { guardrail }, 'Guardrail created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateGuardrail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guardrail = await adminService.updateGuardrail(req.params.id, req.body);
    return sendSuccess(res, { guardrail }, 'Guardrail updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteGuardrail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.deleteGuardrail(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// ==================== AI MODEL MANAGEMENT ====================

export const getAllModels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const models = await adminService.getAllModelsAdmin();
    return sendSuccess(res, { models });
  } catch (error) {
    next(error);
  }
};

export const createModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const model = await adminService.createModel(req.body);
    return sendSuccess(res, { model }, 'Model created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const deleteModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId } = req.params;
    const result = await adminService.deleteModel(modelId);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const updateModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId } = req.params;
    const model = await adminService.updateModel(modelId, req.body);
    return sendSuccess(res, { model });
  } catch (error) {
    next(error);
  }
};

export const toggleModelActive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId } = req.params;
    const model = await adminService.toggleModelActive(modelId);
    return sendSuccess(res, { model, message: model.isActive ? 'Model activated' : 'Model deactivated' });
  } catch (error) {
    next(error);
  }
};

export const testModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { modelId } = req.params;
    const result = await adminService.testModel(modelId);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// ==================== MODEL ACCESS ====================

export const getModelAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const access = await adminService.getModelAccess(req.params.modelId);
    return sendSuccess(res, { access });
  } catch (error) {
    next(error);
  }
};

export const addModelAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const access = await adminService.addModelAccess(req.body);
    return sendCreated(res, { access }, 'Access granted');
  } catch (error) {
    next(error);
  }
};

export const removeModelAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.removeModelAccess(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// ==================== SETTINGS ====================

export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await adminService.getSettings();
    return sendSuccess(res, { settings });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await adminService.updateSettings(req.body);
    return sendSuccess(res, { settings }, 'Settings updated successfully');
  } catch (error) {
    next(error);
  }
};

