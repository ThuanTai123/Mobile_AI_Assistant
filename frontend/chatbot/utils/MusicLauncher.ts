// utils/MusicLauncher.ts
import * as Linking from 'expo-linking';

const politeSuffixes = [
  "dùm tôi", "giùm tôi", "giúp mình", "giúp tôi", "nhé", "với", "nha", "đi", "giùm", "dùm", "thôi", "mà", "hộ mình"
];

// Tách và làm sạch tên bài hát
const extractCleanKeyword = (text: string): string | null => {
  const match = text.toLowerCase().match(/(?:mở|phát|bật|nghe)\s+(?:bài hát|nhạc)?\s*(.+?)\s*(?:trên youtube|bằng youtube|youtube)?$/);
  if (!match || !match[1]) return null;

  let keyword = match[1].trim();

  // Loại bỏ hậu tố lịch sự
  for (const suffix of politeSuffixes) {
    if (keyword.endsWith(suffix)) {
      keyword = keyword.slice(0, -suffix.length).trim();
      break;
    }
  }

  return keyword.length >= 2 ? keyword : "nhạc thư giãn";
};

export const handleOpenMusic = async (msg: string): Promise<string | null> => {
  const normalized = msg.toLowerCase();

  // Kiểm tra có liên quan đến nhạc không
  if (
    normalized.includes("mở nhạc") ||
    normalized.includes("phát nhạc") ||
    normalized.includes("bật nhạc") ||
    normalized.includes("bài hát") ||
    normalized.includes("nghe nhạc") ||
    normalized.includes("youtube")
  ) {
    const keyword = extractCleanKeyword(msg);
    if (!keyword) return null;

    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`;
    await Linking.openURL(searchUrl);
    return `🎵 Đã mở YouTube với từ khoá "${keyword}" cho bạn.`;
  }

  return null;
};
