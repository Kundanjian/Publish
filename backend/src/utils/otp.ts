export const generateOtpCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const isExpired = (date: Date): boolean => {
  return date.getTime() < Date.now();
};
