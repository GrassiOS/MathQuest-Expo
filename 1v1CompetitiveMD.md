// GameScreen.tsx
import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { MatchmakingView } from "../components/MatchmakingView";
import { RouletteView } from "../components/RouletteView";
import { QuizView } from "../components/QuizView";
import { RoundResultView } from "../components/RoundResultView";
import { useWebSocket } from "../hooks/useWebSocket";

export default function GameScreen() {
  const { socket, gameState, data } = useWebSocket();
  
  function renderContent() {
    switch (gameState) {
      case "MATCHMAKING":
        return <MatchmakingView />;
      case "ROULETTE":
        return <RouletteView data={data} />;
      case "QUIZ":
        return <QuizView question={data.question} />;
      case "ROUND_RESULT":
        return <RoundResultView results={data.results} />;
      default:
        return <View />;
    }
  }

  return <View style={{ flex: 1 }}>{renderContent()}</View>;
}