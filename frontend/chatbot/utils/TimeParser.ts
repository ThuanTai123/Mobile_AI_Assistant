// utils/TimeParser.ts

export interface TimeInfo {
  isValid: boolean;
  time: string;
  date: string;
}

export const parseTimeFromMessage = (message: string): TimeInfo => {
  let time = "";
  let date = "";

  const now = new Date();
  const normalized = message.toLowerCase();

  // 🎯 1. Parse time
  const timeMatch =
    normalized.match(/(\d{1,2})h(\d{1,2})/) || // 10h30
    normalized.match(/(\d{1,2}):(\d{2})/) || // 14:00
    normalized.match(/(\d{1,2})\s*giờ\s*(\d{1,2})?/) || // 9 giờ 15
    normalized.match(/(\d{1,2})(?:h| giờ)?/); // fallback: 10h

  if (timeMatch) {
    const hour = timeMatch[1].padStart(2, "0");
    const minute = timeMatch[2] ? timeMatch[2].padStart(2, "0") : "00";
    time = `${hour}:${minute}`;
  }

  // 🎯 2. Parse date
  const today = now.toISOString().split("T")[0];

  if (normalized.includes("hôm nay")) {
    date = today;
  } else if (normalized.includes("ngày mai") || normalized.includes("mai")) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    date = tomorrow.toISOString().split("T")[0];
  } else {
    const dateMatch =
      normalized.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/) || // 30/06/2025
      normalized.match(/(\d{1,2})[\/\-](\d{1,2})/); // 30/06

    if (dateMatch) {
      const day = dateMatch[1].padStart(2, "0");
      const month = dateMatch[2].padStart(2, "0");
      const year = dateMatch[3] || now.getFullYear();
      date = `${year}-${month}-${day}`;
    }
  }

  const isValid = !!time && !!date;

  return {
    isValid,
    time,
    date,
  };
};
