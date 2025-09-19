// utils/getRandomQuestions.ts
import { Question } from "../types/question";

/**
 * Devuelve 5 preguntas aleatorias de una categoría específica
 * @param categoryId id de la categoría
 * @param allQuestions array completo de preguntas disponibles
 */
export function getRandomQuestionsByCategory(
  categoryId: string,
  allQuestions: Question[]
): Question[] {
  // Filtramos solo las preguntas de esa categoría
  const filtered = allQuestions.filter(
    (q) => q.category.id === categoryId
  );

  // Barajamos las preguntas (Fisher–Yates shuffle)
  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }

  // Retornamos máximo 5
  return filtered.slice(0, 5);
}
