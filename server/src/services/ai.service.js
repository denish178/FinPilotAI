import ruleBasedProvider from "./ai/providers/ruleBased.provider.js";
import openaiProvider from "./ai/providers/openai.provider.js";

const PROVIDERS = {
  rule_based: ruleBasedProvider,
  openai: openaiProvider,
};

const resolveProvider = () => {
  const configured = (process.env.AI_PROVIDER || "rule_based").toLowerCase();

  if (configured === "openai" && process.env.OPENAI_API_KEY) {
    return { name: "openai", engine: PROVIDERS.openai };
  }

  if (configured === "openai" && !process.env.OPENAI_API_KEY) {
    return {
      name: "rule_based",
      engine: PROVIDERS.rule_based,
      fallbackReason: "OPENAI_API_KEY not set — using rule-based engine",
    };
  }

  return { name: "rule_based", engine: PROVIDERS.rule_based };
};

const withMeta = async (fn, userId, query) => {
  const provider = resolveProvider();
  const data = await fn(provider.engine, userId, query);

  return {
    ...data,
    meta: {
      provider: data.provider || provider.name,
      fallbackReason: provider.fallbackReason || data.fallbackReason || null,
      generatedAt: new Date().toISOString(),
    },
  };
};

export const analyzeSpendingHabits = (userId, query) =>
  withMeta((engine, uid, q) => engine.analyzeSpendingHabits(uid, q), userId, query);

export const suggestSavings = (userId, query) =>
  withMeta((engine, uid, q) => engine.suggestSavings(uid, q), userId, query);

export const detectUnusualExpenses = (userId, query) =>
  withMeta(
    (engine, uid, q) => engine.detectUnusualExpenses(uid, q),
    userId,
    query,
  );

export const getMonthlySummary = (userId, query) =>
  withMeta((engine, uid, q) => engine.getMonthlySummary(uid, q), userId, query);

export const getPersonalizedTips = (userId, query) =>
  withMeta(
    (engine, uid, q) => engine.getPersonalizedTips(uid, q),
    userId,
    query,
  );

export const getFullInsights = (userId, query) =>
  withMeta((engine, uid, q) => engine.getFullInsights(uid, q), userId, query);

export const getProviderInfo = () => {
  const provider = resolveProvider();
  return {
    activeProvider: provider.name,
    configuredProvider: process.env.AI_PROVIDER || "rule_based",
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    fallbackReason: provider.fallbackReason || null,
    features: [
      "analyze_spending_habits",
      "suggest_savings",
      "detect_unusual_expenses",
      "monthly_summary",
      "personalized_tips",
    ],
  };
};

export default {
  analyzeSpendingHabits,
  suggestSavings,
  detectUnusualExpenses,
  getMonthlySummary,
  getPersonalizedTips,
  getFullInsights,
  getProviderInfo,
};
