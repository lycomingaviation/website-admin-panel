import { Rule } from "antd/lib/form";
import dayjs, { Dayjs } from "dayjs";

export const capitalize = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

type TFormat = "DD-MM-YYYY" | "YYYY-MM-DD";

// export const uiDateFormat = (date?: string) => {
//   if (!date) return null;
//   return dayjs(date, 'YYYY-MM-DD')// Format to the desired output
// };

export const uiDateFormat = (date: string | undefined) =>
  date ? dayjs(date).format("YYYY-MM-DD") : null;

export const uiApiDateFormat = (
  date: Dayjs,
  format: TFormat = "YYYY-MM-DD"
) => {
  return date ? date.format(format) : null;
};

export const minMaxLengthRule = (min: number, max: number): Rule => ({
  validator: (_: any, value: string) => {
    if (value.length < min) {
      return Promise.reject(`Please enter at least ${min} characters.`);
    }
    if (value.length > max) {
      return Promise.reject(`Please enter no more than ${max} characters.`);
    }
    return Promise.resolve();
  },
});

export const getFinancialYear = (forceYear?: number) => {
  const currentDate = new Date();
  let currentYear = forceYear || currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12 (Jan-Dec)

  if (currentMonth >= 4) {
    return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
  } else {
    return `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
  }
};

export const compressImage = (imageData: string, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageData;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
  });
};