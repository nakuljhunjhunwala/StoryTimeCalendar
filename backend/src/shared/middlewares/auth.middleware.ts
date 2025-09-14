import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/shared/config/env.config';
import { ResponseUtil } from '@/shared/utils/response.util';
import { StatusCodes } from '@/shared/constants/http-status.constants';
import { JwtPayload } from '@/modules/auth/auth.dto';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return ResponseUtil.error(
      res,
      'Authorization token is required',
      StatusCodes.UNAUTHORIZED,
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Validate required fields for StoryTime Calendar
    if (!decoded.userId || !decoded.email) {
      return ResponseUtil.error(
        res,
        'Invalid token payload',
        StatusCodes.UNAUTHORIZED,
      );
    }

    req.user = decoded;
    return next();
  } catch {
    return ResponseUtil.error(
      res,
      'Invalid or expired token',
      StatusCodes.UNAUTHORIZED,
    );
  }
};
