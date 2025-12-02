import { Request, Response, NextFunction } from 'express';
import * as artifactService from '../services/artifact.service';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../utils/response';

// Create artifact
export const createArtifact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const artifact = await artifactService.createArtifact(req.user!.id, req.body);
    return sendCreated(res, { artifact }, 'Artifact saved');
  } catch (error) {
    next(error);
  }
};

// Get user's artifacts
export const getUserArtifacts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string | undefined;
    const sessionId = req.query.sessionId as string | undefined;
    const bookmarkedOnly = req.query.bookmarked === 'true';

    const result = await artifactService.getUserArtifacts(req.user!.id, {
      page,
      limit,
      type,
      sessionId,
      bookmarkedOnly,
    });

    return sendPaginated(res, result.artifacts, result.page, result.limit, result.total);
  } catch (error) {
    next(error);
  }
};

// Get artifact by ID
export const getArtifact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const artifact = await artifactService.getArtifact(req.params.id, req.user!.id);
    return sendSuccess(res, { artifact });
  } catch (error) {
    next(error);
  }
};

// Toggle bookmark
export const toggleBookmark = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const artifact = await artifactService.toggleBookmark(req.params.id, req.user!.id);
    return sendSuccess(res, { artifact }, artifact.isBookmarked ? 'Bookmarked' : 'Bookmark removed');
  } catch (error) {
    next(error);
  }
};

// Delete artifact
export const deleteArtifact = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await artifactService.deleteArtifact(req.params.id, req.user!.id);
    return sendNoContent(res);
  } catch (error) {
    next(error);
  }
};

