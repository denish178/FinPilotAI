/**
 * OpenAI provider stub — swap in when OPENAI_API_KEY is configured.
 * Falls back to rule-based formatting if the API call fails.
 */
import ruleBasedProvider from "./ruleBased.provider.js";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const buildPrompt = (feature, context) =>
  `You are FinPilot AI, a personal finance advisor. Feature: ${feature}. Respond in JSON only with actionable insights. Context: ${JSON.stringify(context)}`;

const callOpenAI = async (prompt) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful personal finance assistant. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  return JSON.parse(content);
};

const withOpenAI = async (feature, userId, query, fallbackFn) => {
  const context = await ruleBasedProvider.gatherFinancialContext(userId, query);

  try {
    const aiResult = await callOpenAI(buildPrompt(feature, context));
    return {
      provider: "openai",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      ...aiResult,
    };
  } catch (error) {
    const fallback = await fallbackFn(userId, query);
    return {
      ...fallback,
      provider: "rule_based",
      fallbackReason: error.message,
    };
  }
};

export const analyzeSpendingHabits = (userId, query) =>
  withOpenAI(
    "analyze_spending_habits",
    userId,
    query,
    ruleBasedProvider.analyzeSpendingHabits,
  );

export const suggestSavings = (userId, query) =>
  withOpenAI(
    "suggest_savings",
    userId,
    query,
    ruleBasedProvider.suggestSavings,
  );

export const detectUnusualExpenses = (userId, query) =>
  withOpenAI(
    "detect_unusual_expenses",
    userId,
    query,
    ruleBasedProvider.detectUnusualExpenses,
  );

export const getMonthlySummary = (userId, query) =>
  withOpenAI(
    "monthly_financial_summary",
    userId,
    query,
    ruleBasedProvider.getMonthlySummary,
  );

export const getPersonalizedTips = (userId, query) =>
  withOpenAI(
    "personalized_financial_tips",
    userId,
    query,
    ruleBasedProvider.getPersonalizedTips,
  );

export const getFullInsights = async (userId, query) => {
  const [spendingHabits, savingsSuggestions, unusualExpenses, monthlySummary, tips] =
    await Promise.all([
      analyzeSpendingHabits(userId, query),
      suggestSavings(userId, query),
      detectUnusualExpenses(userId, query),
      getMonthlySummary(userId, query),
      getPersonalizedTips(userId, query),
    ]);

  return {
    provider: process.env.OPENAI_API_KEY ? "openai" : "rule_based",
    period: spendingHabits.period,
    spendingHabits,
    savingsSuggestions,
    unusualExpenses,
    monthlySummary,
    tips,
  };
};

export default {
  analyzeSpendingHabits,
  suggestSavings,
  detectUnusualExpenses,
  getMonthlySummary,
  getPersonalizedTips,
  getFullInsights,
};
