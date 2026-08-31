import english from "./translations/en-US";
import chineseSimplified from "./translations/zh-CN";

// 起航实验室当前只面向中文用户。仅打包中文和英文兜底，可显著减少
// 每个页面都必须下载、解析的翻译 JavaScript。
export const LOCALES = {
  CHINESE_SIMPLIFIED: {
    name: "简体中文",
    code: "zh-CN",
    messages: chineseSimplified,
  },
  ENGLISH: {
    name: "English",
    code: "en-US",
    messages: english,
  },
};
