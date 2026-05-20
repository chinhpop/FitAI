import {
  fitnessProfileSchema,
  generatedPlansSchema,
} from "../schemas/fitness.schema.js";
import { chatWithCohere } from "./cohere.service.js";

const stripJsonFence = (text) =>
  text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

const toHHMM = (value, fallback) => {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  const match = normalized.match(/^(\d{1,2}):([0-5]\d)$/);

  if (!match) {
    return fallback;
  }

  const hour = Math.min(Number(match[1]), 23).toString().padStart(2, "0");
  return `${hour}:${match[2]}`;
};

const clampNumber = (value, min, max, fallback) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(Math.max(Math.round(number), min), max);
};

const fallbackExercises = [
  { name: "Squat", sets: 3, reps: "10-12", rest: "60s" },
  { name: "Push-up", sets: 3, reps: "8-12", rest: "60s" },
  { name: "Plank", sets: 3, reps: "30s", rest: "45s" },
];

const fallbackMeals = [
  { name: "Bua sang - Yen mach va trung", calories: 450, time: "07:00" },
  { name: "Bua trua - Com ga va rau", calories: 650, time: "12:30" },
  { name: "Bua toi - Ca va khoai lang", calories: 600, time: "18:30" },
];

const normalizeExercises = (exercises, dayIndex) => {
  const source = Array.isArray(exercises) && exercises.length > 0
    ? exercises
    : fallbackExercises;

  return source.slice(0, 8).map((rawExercise, exerciseIndex) => {
    const exercise = rawExercise || {};
    const fallback = fallbackExercises[exerciseIndex % fallbackExercises.length];

    return {
      id: exercise.id || `ex-${dayIndex + 1}-${exerciseIndex + 1}`,
      name: String(exercise.name || fallback.name),
      sets: clampNumber(exercise.sets, 1, 8, fallback.sets),
      reps: String(exercise.reps || fallback.reps),
      rest: String(exercise.rest || fallback.rest),
    };
  });
};

const normalizeMeals = (meals) => {
  const source = Array.isArray(meals) ? meals.slice(0, 8) : [];

  while (source.length < 3) {
    source.push(fallbackMeals[source.length % fallbackMeals.length]);
  }

  return source.map((rawMeal, mealIndex) => {
    const meal = rawMeal || {};
    const fallback = fallbackMeals[mealIndex % fallbackMeals.length];

    return {
      id: meal.id || `meal-${mealIndex + 1}`,
      name: String(meal.name || fallback.name),
      calories: clampNumber(meal.calories, 50, 2500, fallback.calories),
      time: toHHMM(meal.time, fallback.time),
    };
  });
};

const normalizePlans = (plans) => {
  const sourceDays =
    Array.isArray(plans?.workoutPlan?.days) && plans.workoutPlan.days.length > 0
      ? plans.workoutPlan.days
      : [{ day: "Thu Hai", exercises: fallbackExercises }];

  return {
    workoutPlan: {
      days: sourceDays.slice(0, 7).map((rawDay, dayIndex) => {
        const day = rawDay || {};

        return {
        id: day.id || `day-${dayIndex + 1}`,
        day: String(day.day || `Ngay ${dayIndex + 1}`),
        exercises: normalizeExercises(day.exercises, dayIndex),
        };
      }),
    },
    nutritionPlan: {
      dailyCalories: clampNumber(plans?.nutritionPlan?.dailyCalories, 900, 6000, 2200),
      macros: {
        protein: clampNumber(plans?.nutritionPlan?.macros?.protein, 20, 400, 150),
        carbs: clampNumber(plans?.nutritionPlan?.macros?.carbs, 20, 800, 220),
        fats: clampNumber(plans?.nutritionPlan?.macros?.fats, 10, 250, 70),
      },
      meals: normalizeMeals(plans?.nutritionPlan?.meals),
    },
  };
};

const buildPlanPrompt = (profile) => `
Generate a JSON object for a Vietnamese AI fitness app.

The JSON must match this frontend shape exactly:
{
  "workoutPlan": {
    "days": [
      {
        "id": "day-1",
        "day": "Thu Hai",
        "exercises": [
          { "id": "ex-1-1", "name": "Squat", "sets": 3, "reps": "10-12", "rest": "60s" }
        ]
      }
    ]
  },
  "nutritionPlan": {
    "dailyCalories": 2200,
    "macros": { "protein": 150, "carbs": 220, "fats": 70 },
    "meals": [
      { "id": "meal-1", "name": "Bua sang - Yen mach va trung", "calories": 450, "time": "07:00" }
    ]
  }
}

Rules:
- Return JSON only. No markdown. No explanations.
- Use Vietnamese names without accents if needed for compatibility.
- Create 3 to 5 workout days, each with 3 to 5 exercises.
- Use ids like day-1, ex-1-1, meal-1.
- Meal time must be 24-hour HH:mm.
- Respect injuries, dietary restrictions, and goals.
- Keep recommendations safe and realistic for the user's fitness level.
- Do not prescribe medical treatment.

User fitness profile:
${JSON.stringify(profile, null, 2)}
`;

export const generateFitnessPlans = async (rawProfile) => {
  const profile = fitnessProfileSchema.parse(rawProfile);

  const { text, model, finishReason, usage } = await chatWithCohere({
    messages: [
      {
        role: "system",
        content:
          "You are a careful fitness coach and nutrition planner. You generate strict JSON for a React frontend.",
      },
      { role: "user", content: buildPlanPrompt(profile) },
    ],
    responseFormat: {
      type: "json_object",
    },
    maxTokens: 3000,
    temperature: 0.25,
  });

  const parsed = JSON.parse(stripJsonFence(text));
  const plans = generatedPlansSchema.parse(normalizePlans(parsed));

  return {
    ...plans,
    model,
    finishReason,
    usage,
  };
};
