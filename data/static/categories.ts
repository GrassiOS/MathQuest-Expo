// data/categories.ts
import { Category } from "../../types/Category";

export const categories: Record<string, Category> = {
    
    suma: {
        id: "suma",
        displayName: "Suma",
        mascotName: "Plusito",
        bgColor1: "#6FFF8C",
        bgColor2: "#00F715",
    },
    resta: {
        id: "resta",
        displayName: "Resta",
        mascotName: "Restin",
        bgColor1: "#537BFD",
        bgColor2: "#7EE1FF",
    },
    multiplicacion: {
        id: "multiplicacion",
        displayName: "Multiplicación",
        mascotName: "Porfix",
        bgColor1: "#FF171B",
        bgColor2: "#FF5659",
    },
    division: {
        id: "division",
        displayName: "División",
        mascotName: "Dividin",
        bgColor1: "#FFDD6F",
        bgColor2: "#F2F700",
    },
    
    combinada: {
        id: "combinada",
        displayName: "Combinada",
        mascotName: "Porfix", //it is actually "Totalin"
        bgColor1: "#DF5ED0",
        bgColor2: "#C71BED",
    },
};


//2.0