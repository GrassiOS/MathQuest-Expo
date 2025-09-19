// data/static/questions.ts
import { Question } from "../../types/question";
import { categories } from "./categories";

export const questions: Question[] = [
  // SUMA questions
  {
    id: "suma_1",
    category: categories.suma,
    texto: "15 + 23",
    respuestaCorrecta: "38",
    opciones: ["38", "35", "41"]
  },
  {
    id: "suma_2",
    category: categories.suma,
    texto: "47 + 29",
    respuestaCorrecta: "76",
    opciones: ["76", "74", "78"]
  },
  {
    id: "suma_3",
    category: categories.suma,
    texto: "134 + 267",
    respuestaCorrecta: "401",
    opciones: ["401", "399", "403"]
  },
  {
    id: "suma_4",
    category: categories.suma,
    texto: "89 + 56",
    respuestaCorrecta: "145",
    opciones: ["145", "143", "147"]
  },
  {
    id: "suma_5",
    category: categories.suma,
    texto: "78 + 94",
    respuestaCorrecta: "172",
    opciones: ["172", "170", "174"]
  },
  {
    id: "suma_6",
    category: categories.suma,
    texto: "256 + 189",
    respuestaCorrecta: "445",
    opciones: ["445", "443", "447"]
  },
  {
    id: "suma_7",
    category: categories.suma,
    texto: "67 + 38",
    respuestaCorrecta: "105",
    opciones: ["105", "103", "107"]
  },

  // RESTA questions
  {
    id: "resta_1",
    category: categories.resta,
    texto: "234 - 12",
    respuestaCorrecta: "222",
    opciones: ["222", "220", "224"]
  },
  {
    id: "resta_2",
    category: categories.resta,
    texto: "156 - 89",
    respuestaCorrecta: "67",
    opciones: ["67", "65", "69"]
  },
  {
    id: "resta_3",
    category: categories.resta,
    texto: "403 - 178",
    respuestaCorrecta: "225",
    opciones: ["225", "223", "227"]
  },
  {
    id: "resta_4",
    category: categories.resta,
    texto: "87 - 29",
    respuestaCorrecta: "58",
    opciones: ["58", "56", "60"]
  },
  {
    id: "resta_5",
    category: categories.resta,
    texto: "345 - 167",
    respuestaCorrecta: "178",
    opciones: ["178", "176", "180"]
  },
  {
    id: "resta_6",
    category: categories.resta,
    texto: "92 - 45",
    respuestaCorrecta: "47",
    opciones: ["47", "45", "49"]
  },
  {
    id: "resta_7",
    category: categories.resta,
    texto: "278 - 139",
    respuestaCorrecta: "139",
    opciones: ["139", "137", "141"]
  },

  // MULTIPLICACIÓN questions
  {
    id: "multiplicacion_1",
    category: categories.multiplicacion,
    texto: "12 × 8",
    respuestaCorrecta: "96",
    opciones: ["96", "94", "98"]
  },
  {
    id: "multiplicacion_2",
    category: categories.multiplicacion,
    texto: "15 × 7",
    respuestaCorrecta: "105",
    opciones: ["105", "103", "107"]
  },
  {
    id: "multiplicacion_3",
    category: categories.multiplicacion,
    texto: "23 × 4",
    respuestaCorrecta: "92",
    opciones: ["92", "90", "94"]
  },
  {
    id: "multiplicacion_4",
    category: categories.multiplicacion,
    texto: "9 × 13",
    respuestaCorrecta: "117",
    opciones: ["117", "115", "119"]
  },
  {
    id: "multiplicacion_5",
    category: categories.multiplicacion,
    texto: "16 × 6",
    respuestaCorrecta: "96",
    opciones: ["96", "94", "98"]
  },
  {
    id: "multiplicacion_6",
    category: categories.multiplicacion,
    texto: "14 × 9",
    respuestaCorrecta: "126",
    opciones: ["126", "124", "128"]
  },
  {
    id: "multiplicacion_7",
    category: categories.multiplicacion,
    texto: "11 × 12",
    respuestaCorrecta: "132",
    opciones: ["132", "130", "134"]
  },

  // DIVISIÓN questions
  {
    id: "division_1",
    category: categories.division,
    texto: "144 ÷ 12",
    respuestaCorrecta: "12",
    opciones: ["12", "11", "13"]
  },
  {
    id: "division_2",
    category: categories.division,
    texto: "96 ÷ 8",
    respuestaCorrecta: "12",
    opciones: ["12", "11", "13"]
  },
  {
    id: "division_3",
    category: categories.division,
    texto: "135 ÷ 15",
    respuestaCorrecta: "9",
    opciones: ["9", "8", "10"]
  },
  {
    id: "division_4",
    category: categories.division,
    texto: "84 ÷ 7",
    respuestaCorrecta: "12",
    opciones: ["12", "11", "13"]
  },
  {
    id: "division_5",
    category: categories.division,
    texto: "108 ÷ 9",
    respuestaCorrecta: "12",
    opciones: ["12", "11", "13"]
  },
  {
    id: "division_6",
    category: categories.division,
    texto: "156 ÷ 13",
    respuestaCorrecta: "12",
    opciones: ["12", "11", "13"]
  },
  {
    id: "division_7",
    category: categories.division,
    texto: "72 ÷ 6",
    respuestaCorrecta: "12",
    opciones: ["12", "11", "13"]
  },

  // COMBINADA questions
  {
    id: "combinada_1",
    category: categories.combinada,
    texto: "5 + 3 × 2",
    respuestaCorrecta: "11",
    opciones: ["11", "16", "10"]
  },
  {
    id: "combinada_2",
    category: categories.combinada,
    texto: "20 - 4 × 3",
    respuestaCorrecta: "8",
    opciones: ["8", "48", "12"]
  },
  {
    id: "combinada_3",
    category: categories.combinada,
    texto: "15 ÷ 3 + 7",
    respuestaCorrecta: "12",
    opciones: ["12", "2", "22"]
  },
  {
    id: "combinada_4",
    category: categories.combinada,
    texto: "8 × 2 - 6",
    respuestaCorrecta: "10",
    opciones: ["10", "2", "22"]
  },
  {
    id: "combinada_5",
    category: categories.combinada,
    texto: "24 ÷ 4 + 5",
    respuestaCorrecta: "11",
    opciones: ["11", "1", "29"]
  },
  {
    id: "combinada_6",
    category: categories.combinada,
    texto: "12 + 18 ÷ 6",
    respuestaCorrecta: "15",
    opciones: ["15", "5", "30"]
  },
  {
    id: "combinada_7",
    category: categories.combinada,
    texto: "9 × 3 - 15",
    respuestaCorrecta: "12",
    opciones: ["12", "-6", "42"]
  }
];
