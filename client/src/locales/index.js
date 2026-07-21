import en from "./en.js";
import hi from "./hi.js";

const dictionaries = { en, hi };

export const translate = (language, key, fallback = key) =>
  dictionaries[language]?.[key] ?? dictionaries.en[key] ?? fallback;

export const getDictionary = (language) => dictionaries[language] ?? dictionaries.en;

export default dictionaries;
