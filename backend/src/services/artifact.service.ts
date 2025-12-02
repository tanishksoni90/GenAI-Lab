import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';

interface CreateArtifactInput {
  sessionId: string;
  type: 'text' | 'code' | 'image' | 'audio';
  title?: string;
  content: string;
  modelUsed?: string;
  score?: number;
}

// Create artifact
export const createArtifact = async (userId: string, input: CreateArtifactInput) => {
  // Verify session belongs to user
  const session = await prisma.session.findUnique({
    where: { id: input.sessionId },
    select: { userId: true },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  if (session.userId !== userId) {
    throw new ForbiddenError('Not authorized');
  }

  return prisma.artifact.create({
    data: {
      userId,
      ...input,
    },
  });
};

// Get user's artifacts
export const getUserArtifacts = async (
  userId: string,
  options: {
    page?: number;
    limit?: number;
    type?: string;
    sessionId?: string;
    bookmarkedOnly?: boolean;
  } = {}
) => {
  const { page = 1, limit = 20, type, sessionId, bookmarkedOnly } = options;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (type) where.type = type;
  if (sessionId) where.sessionId = sessionId;
  if (bookmarkedOnly) where.isBookmarked = true;

  const [artifacts, total] = await Promise.all([
    prisma.artifact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        session: {
          select: {
            id: true,
            title: true,
            model: {
              select: { name: true, provider: true },
            },
          },
        },
      },
    }),
    prisma.artifact.count({ where }),
  ]);

  return { artifacts, total, page, limit };
};

// Get artifact by ID
export const getArtifact = async (artifactId: string, userId: string) => {
  const artifact = await prisma.artifact.findUnique({
    where: { id: artifactId },
    include: {
      session: {
        select: {
          id: true,
          title: true,
          model: {
            select: { name: true, provider: true },
          },
        },
      },
    },
  });

  if (!artifact) {
    throw new NotFoundError('Artifact not found');
  }

  if (artifact.userId !== userId) {
    throw new ForbiddenError('Not authorized');
  }

  return artifact;
};

// Toggle bookmark
export const toggleBookmark = async (artifactId: string, userId: string) => {
  const artifact = await prisma.artifact.findUnique({
    where: { id: artifactId },
    select: { userId: true, isBookmarked: true },
  });

  if (!artifact) {
    throw new NotFoundError('Artifact not found');
  }

  if (artifact.userId !== userId) {
    throw new ForbiddenError('Not authorized');
  }

  return prisma.artifact.update({
    where: { id: artifactId },
    data: { isBookmarked: !artifact.isBookmarked },
  });
};

// Delete artifact
export const deleteArtifact = async (artifactId: string, userId: string) => {
  const artifact = await prisma.artifact.findUnique({
    where: { id: artifactId },
    select: { userId: true },
  });

  if (!artifact) {
    throw new NotFoundError('Artifact not found');
  }

  if (artifact.userId !== userId) {
    throw new ForbiddenError('Not authorized');
  }

  await prisma.artifact.delete({
    where: { id: artifactId },
  });

  return { message: 'Artifact deleted' };
};

