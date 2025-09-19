import { Category } from "./Category";


// Question type
export type Question = {
  id: string;
  category: Category;          // Relación directa a la categoría
  texto: string;               // Enunciado de la pregunta

  // Respuesta abierta que el usuario debe escribir
  respuestaCorrecta: string;

  // Opciones para el “power-up” (una de ellas debe coincidir con respuestaCorrecta)
  opciones: [string, string, string];  // exactamente 3 opciones
};