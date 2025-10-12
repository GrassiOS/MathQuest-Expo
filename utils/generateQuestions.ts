import { Category } from '@/types/Category';

export type DifficultyLevel = 1 | 2 | 3; // 1: single digits, 2: double digits, 3: triple digits

export type GeneratedQuestion = {
  id: string;
  question: string;
  correctAnswer: number;
  category: Category;
  difficulty: DifficultyLevel;
  options?: [string, string, string]; // For power-up questions
};

/**
 * Generates random math questions based on category and difficulty
 */
export function generateQuestion(
  category: Category,
  difficulty: DifficultyLevel = 1
): GeneratedQuestion {
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Generate numbers based on difficulty
  const getRandomNumber = () => {
    switch (difficulty) {
      case 1: return Math.floor(Math.random() * 10) + 1; // 1-10
      case 2: return Math.floor(Math.random() * 90) + 10; // 10-99
      case 3: return Math.floor(Math.random() * 900) + 100; // 100-999
      default: return Math.floor(Math.random() * 10) + 1;
    }
  };

  const a = getRandomNumber();
  const b = getRandomNumber();

  switch (category) {
    case 'Suma':
      const sumAnswer = a + b;
      return {
        id,
        question: `${a} + ${b} = ?`,
        correctAnswer: sumAnswer,
        category,
        difficulty,
        options: generateOptions(sumAnswer, difficulty)
      };

    case 'Resta':
      // Ensure positive result for subtraction
      const larger = Math.max(a, b);
      const smaller = Math.min(a, b);
      const subAnswer = larger - smaller;
      return {
        id,
        question: `${larger} - ${smaller} = ?`,
        correctAnswer: subAnswer,
        category,
        difficulty,
        options: generateOptions(subAnswer, difficulty)
      };

    case 'Multiplicación':
      // Use smaller numbers for multiplication to keep it reasonable
      const multA = difficulty === 1 ? a : Math.min(a, 12);
      const multB = difficulty === 1 ? b : Math.min(b, 12);
      const multAnswer = multA * multB;
      return {
        id,
        question: `${multA} × ${multB} = ?`,
        correctAnswer: multAnswer,
        category,
        difficulty,
        options: generateOptions(multAnswer, difficulty)
      };

    case 'División':
      // Generate clean division problems
      const divisor = difficulty === 1 ? Math.floor(Math.random() * 9) + 2 : Math.floor(Math.random() * 12) + 2;
      const quotient = getRandomNumber();
      const dividend = divisor * quotient;
      return {
        id,
        question: `${dividend} ÷ ${divisor} = ?`,
        correctAnswer: quotient,
        category,
        difficulty,
        options: generateOptions(quotient, difficulty)
      };

    default:
      // Default to addition
      const defaultAnswer = a + b;
      return {
        id,
        question: `${a} + ${b} = ?`,
        correctAnswer: defaultAnswer,
        category: 'Suma',
        difficulty,
        options: generateOptions(defaultAnswer, difficulty)
      };
  }
}

/**
 * Generates 3 options for multiple choice questions (power-ups)
 */
function generateOptions(correctAnswer: number, difficulty: DifficultyLevel): [string, string, string] {
  const options: number[] = [correctAnswer];
  
  // Generate 2 incorrect options
  while (options.length < 3) {
    let wrongAnswer: number;
    
    if (difficulty === 1) {
      // For single digits, vary by ±1-3
      const variation = Math.floor(Math.random() * 3) + 1;
      wrongAnswer = correctAnswer + (Math.random() < 0.5 ? variation : -variation);
    } else if (difficulty === 2) {
      // For double digits, vary by ±5-15
      const variation = Math.floor(Math.random() * 11) + 5;
      wrongAnswer = correctAnswer + (Math.random() < 0.5 ? variation : -variation);
    } else {
      // For triple digits, vary by ±10-50
      const variation = Math.floor(Math.random() * 41) + 10;
      wrongAnswer = correctAnswer + (Math.random() < 0.5 ? variation : -variation);
    }
    
    // Ensure positive numbers and no duplicates
    if (wrongAnswer > 0 && !options.includes(wrongAnswer)) {
      options.push(wrongAnswer);
    }
  }
  
  // Shuffle options
  const shuffled = options.sort(() => Math.random() - 0.5);
  return [shuffled[0].toString(), shuffled[1].toString(), shuffled[2].toString()];
}

/**
 * Gets a random category for variety
 */
export function getRandomCategory(): Category {
  const categories: Category[] = ['Suma', 'Resta', 'Multiplicación', 'División'];
  return categories[Math.floor(Math.random() * categories.length)];
}

/**
 * Determines difficulty progression based on score
 */
export function getDifficultyFromScore(score: number): DifficultyLevel {
  if (score < 5) return 1;      // First 5 questions: single digits
  if (score < 15) return 2;     // Next 10 questions: double digits
  return 3;                     // 15+ questions: triple digits
}
