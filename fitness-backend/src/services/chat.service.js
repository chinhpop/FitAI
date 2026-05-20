import { chatRequestSchema } from "../schemas/fitness.schema.js";
import { chatWithCohere } from "./cohere.service.js";

const buildContext = ({ fitnessProfile, workoutPlan, nutritionPlan }) => {
  const context = {};

  if (fitnessProfile) {
    context.fitnessProfile = fitnessProfile;
  }

  if (workoutPlan) {
    context.workoutPlan = workoutPlan;
  }

  if (nutritionPlan) {
    context.nutritionPlan = nutritionPlan;
  }

  return JSON.stringify(context, null, 2);
};

const toCohereHistory = (history) =>
  history.slice(-8).map((message) => ({
    role: message.role === "user" ? "user" : "assistant",
    content: message.content,
  }));

export const generateAIResponse = async (payload) => {
  const request = chatRequestSchema.parse(payload);
  const { text, model, finishReason, usage } = await chatWithCohere({
    messages: [
      {
        role: "system",
        content:
          "You are FitAI, a friendly Vietnamese AI fitness coach. Answer concisely, practically, and safely. If the user asks about pain, illness, or injury, recommend professional medical advice.",
      },
      {
        role: "system",
        content: `Current user app data, if available:\n${buildContext(request)}`,
      },
      ...toCohereHistory(request.history),
      { role: "user", content: request.message },
    ],
    maxTokens: 3000,
    temperature: 0.45,
  });

  return {
    reply: text,
    model,
    finishReason,
    usage,
  };
};
