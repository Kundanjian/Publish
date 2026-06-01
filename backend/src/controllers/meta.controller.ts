import { Request, Response } from 'express';

export const getMobileAppMeta = async (_req: Request, res: Response) => {
  return res.status(200).json({
    installUrl:
      'https://play.google.com/store/apps/details?id=com.unio.mobile'
  });
};
