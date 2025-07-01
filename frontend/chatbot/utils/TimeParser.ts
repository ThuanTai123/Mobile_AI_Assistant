// utils/TimeParser.ts
export interface ParsedTime {
  time: string;
  date: string;
  isValid: boolean;
  originalText: string;
}

export const parseTimeFromMessage = (message: string): ParsedTime => {
  console.log("🕐 [TimeParser] Parsing message:", message);
  
  const lowerMessage = message.toLowerCase();
  const today = new Date();
  
  // Patterns for time recognition - ✅ FIX: Improved regex for Vietnamese
  const timePatterns = [
    // 11h55, 12h30, 1h, 23h (Vietnamese format)
    /(?:lúc\s+)?(\d{1,2})h(\d{1,2})?/g,
    // 12:30, 1:45
    /(?:lúc\s+)?(\d{1,2}):(\d{2})/g,
    // 12 giờ 30, 1 giờ 45 phút
    /(?:lúc\s+)?(\d{1,2})\s*giờ(?:\s*(\d{1,2})(?:\s*phút)?)?/g,
    // 8 AM, 2 PM
    /(?:lúc\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/gi,
  ];

  // Date patterns
  const datePatterns = [
    /(ngày\s+mai|mai)/g,
    /(hôm\s+nay)/g,
    /ngày\s+(\d{1,2})(?:\/(\d{1,2}))?/g,
  ];

  let parsedTime: string | null = null;
  let parsedDate: string = today.toISOString().split('T')[0];

  // Parse time with detailed logging
  for (let i = 0; i < timePatterns.length; i++) {
    const pattern = timePatterns[i];
    // ✅ FIX: Reset regex lastIndex to avoid issues
    pattern.lastIndex = 0;
    const match = pattern.exec(lowerMessage);
    console.log(`🔍 [TimeParser] Pattern ${i + 1}:`, pattern.source, "Match:", match);
    
    if (match) {
      let hour = parseInt(match[1]);
      let minute = parseInt(match[2] || '0');
      
      console.log(`⏰ [TimeParser] Extracted - Hour: ${hour}, Minute: ${minute}`);
      
      // Handle AM/PM
      if (match[3]) {
        const ampm = match[3].toLowerCase();
        if (ampm === 'pm' && hour !== 12) hour += 12;
        if (ampm === 'am' && hour === 12) hour = 0;
        console.log(`🌅 [TimeParser] AM/PM adjusted - Hour: ${hour}`);
      }
      
      // Validate time
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        parsedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        console.log(`✅ [TimeParser] Valid time found: ${parsedTime}`);
        break;
      } else {
        console.log(`❌ [TimeParser] Invalid time - Hour: ${hour}, Minute: ${minute}`);
      }
    }
  }

  // Parse date
  for (const pattern of datePatterns) {
    pattern.lastIndex = 0; // Reset regex
    const match = pattern.exec(lowerMessage);
    if (match) {
      console.log(`📅 [TimeParser] Date pattern matched:`, match);
      if (match[1] && (match[1].includes('mai') || match[1] === 'mai')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        parsedDate = tomorrow.toISOString().split('T')[0];
        console.log(`📅 [TimeParser] Tomorrow date: ${parsedDate}`);
      } else if (match[1] && match[1].includes('hôm nay')) {
        parsedDate = today.toISOString().split('T')[0];
        console.log(`📅 [TimeParser] Today date: ${parsedDate}`);
      }
      break;
    }
  }

  const result = {
    time: parsedTime || '',
    date: parsedDate,
    isValid: parsedTime !== null,
    originalText: message
  };

  console.log(`🎯 [TimeParser] Final result:`, result);
  return result;
};