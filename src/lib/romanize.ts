import { pinyin } from "pinyin-pro";

const HAN = /\p{Script=Han}/u;
// Characters that end a word on Chinese street signs: 前进西路 -> "Qianjin Xilu", 玉山镇 -> "Yushan Zhen".
const SUFFIX = new Set("路街道巷弄市区镇县村号店");
const DIRECTION = new Set("东西南北中");

export const hasHan = (s: string) => HAN.test(s);

/**
 * Chinese place text to sign-style pinyin, e.g. "昆山市玉山镇前进西路1801号" -> "Kunshan Shi Yushan Zhen Qianjin Xilu 1801 Hao".
 * Non-Chinese characters pass through untouched. Not a translation, but readable and sayable to a taxi driver.
 */
export function romanize(text: string): string {
  const chars = [...text];
  const words: string[] = [];
  let word = "";
  let directionOpen = false;
  const flush = () => {
    if (word) words.push(word[0].toUpperCase() + word.slice(1));
    word = "";
  };
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    // 大道 ("avenue") is a two-character suffix: 杜克大道 -> "Duke Dadao", not "Dukeda Dao".
    if (c === "大" && chars[i + 1] === "道" && word) {
      flush();
      word = "dadao";
      flush();
      i++;
      directionOpen = false;
      continue;
    }
    if (!HAN.test(c)) {
      // Latin letters, digits and punctuation pass through; a space or a Chinese character ends the run.
      if (!c.trim()) flush();
      else if (word && HAN.test(chars[i - 1] ?? "")) {
        flush();
        word = c;
      } else word += c;
      directionOpen = false;
      continue;
    }
    if (word && !HAN.test(chars[i - 1] ?? "")) flush();
    const py = pinyin(c, { toneType: "none" }).replace(/ü/g, "u");
    if (DIRECTION.has(c) && SUFFIX.has(chars[i + 1] ?? "")) {
      // 西路 -> "Xilu": the direction opens the suffix word.
      flush();
      word = py;
      directionOpen = true;
    } else if (SUFFIX.has(c)) {
      if (!directionOpen) flush();
      word += py;
      directionOpen = false;
      flush();
    } else {
      word += py;
    }
  }
  flush();
  return words
    .join(" ")
    .replace(/\s+([)）,，.])/g, "$1")
    .replace(/([(（])\s+/g, "$1")
    .replace(/[（]/g, "(")
    .replace(/[）]/g, ")")
    .replace(/，/g, ",");
}
