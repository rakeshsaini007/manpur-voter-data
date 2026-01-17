
import { TARGET_DATE } from '../constants';

export const calculateAgeAsOf2026 = (dobString: string): string => {
  if (!dobString) return '';
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return '';

  let age = TARGET_DATE.getFullYear() - dob.getFullYear();
  const m = TARGET_DATE.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && TARGET_DATE.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age.toString() : '0';
};

export const formatAadhar = (value: string): string => {
  return value.replace(/\D/g, '').substring(0, 12);
};
