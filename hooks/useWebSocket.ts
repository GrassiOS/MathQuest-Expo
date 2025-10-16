/**
 * WebSocket Hook for MathQuest 1v1 Online Game
 * Handles connection, message sending/receiving, and reconnection logic
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

// WebSocket Event Types
export const WEBSOCKET_EVENTS = {
  // Client to Server
  JOIN_QUEUE: 'JOIN_QUEUE',
  PLAYER_READY: 'PLAYER_READY',
  SUBMIT_ANSWER: 'SUBMIT_ANSWER',
  FINISHED_QUIZ: 'FINISHED_QUIZ',
  READY_FOR_NEXT_ROUND: 'READY_FOR_NEXT_ROUND',
  READY_TO_VIEW_RESULTS: 'READY_TO_VIEW_RESULTS',
  RECONNECT: 'RECONNECT',
  
  // Server to Client
  MATCH_FOUND: 'MATCH_FOUND',
  ROUND_START: 'ROUND_START',
  ROUND_CATEGORY: 'ROUND_CATEGORY',
  TIME_WARNING: 'TIME_WARNING',
  ROUND_END: 'ROUND_END',
  ROUND_RESULT: 'ROUND_RESULT',
  SHOW_RESULTS: 'SHOW_RESULTS',
  BOTH_PLAYERS_READY_FOR_RESULTS: 'BOTH_PLAYERS_READY_FOR_RESULTS',
  OPPONENT_FINISHED: 'OPPONENT_FINISHED',
  MATCH_END: 'MATCH_END',
  ERROR: 'ERROR',
  PLAYER_DISCONNECTED: 'PLAYER_DISCONNECTED',
  PLAYER_RECONNECTED: 'PLAYER_RECONNECTED',
  WELCOME: 'WELCOME'
} as const;

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface MatchData {
  matchId: string;
  players: Array<{
    id: string;
    username: string;
    avatar: any;
  }>;
  currentRound: number;
  maxRounds: number;
}

export interface RoundData {
  category: {
    id: string;
    displayName: string;
    mascotName: string;
  };
  questions: Array<{
    id: string;
    texto: string;
    respuestaCorrecta: string;
    opciones: string[];
  }>;
}

export interface RoundResult {
  winnerId: string;
  scores: Record<string, {
    score: number;
    correctAnswers: number;
    totalTime: number;
    fastestBonus?: boolean;
  }>;
  category: any;
  mascotAsset: string;
  fastestPlayer?: string;
}

export interface MatchEndData {
  winner: {
    id: string;
    username: string;
    avatar: any;
    roundsWon: number;
    totalScore: number;
  };
  loser: {
    id: string;
    username: string;
    avatar: any;
    roundsWon: number;
    totalScore: number;
  };
  rounds: any[];
  duration: number;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  matchData: MatchData | null;
  roundData: RoundData | null;
  roundResult: RoundResult | null;
  matchEndData: MatchEndData | null;
  timeRemaining: number;
  isPlayerReady: boolean;
  playerDisconnected: string | null;
  opponentFinished: boolean;
  showOpponentFinishAnimation: boolean;
  showResults: boolean;
  opponentFinishedData: any | null;
  bothPlayersReadyForResults: boolean;
  resultsDelay: number;
}

const WEBSOCKET_URL = 'ws://192.168.1.214:8080'; // Change this to your server URL
//const WEBSOCKET_URL = 'ws://10.41.87.53:8080'; // Change this to your server URL
const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export const useWebSocket = (playerId?: string, username?: string, avatar?: any, initialMatchData?: any) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isManualDisconnectRef = useRef(false);

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    matchData: null, // Don't initialize with initialMatchData to avoid infinite loops
    roundData: null,
    roundResult: null,
    matchEndData: null,
    timeRemaining: 0,
    isPlayerReady: false,
    playerDisconnected: null,
    opponentFinished: false,
    showOpponentFinishAnimation: false,
    showResults: false,
    opponentFinishedData: null,
    bothPlayersReadyForResults: false,
    resultsDelay: 2500
  });

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const ws = new WebSocket(WEBSOCKET_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null
        }));
        reconnectAttemptsRef.current = 0;
        
        // Send a ping to test connection
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
          }
        }, 1000);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 Raw WebSocket message received:', message.type, message.data);
          
          // Log all messages to debug
          if (message.type === 'SHOW_RESULTS') {
            console.log('🎯 SHOW_RESULTS message received in onmessage handler');
          }
          
          handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false
        }));

        // Don't reconnect for normal closure (code 1000) or if manually disconnected
        if (event.code === 1000 || isManualDisconnectRef.current) {
          console.log('Normal closure or manual disconnect, not reconnecting');
          return;
        }

        // Attempt to reconnect if not manually disconnected
        if (!isManualDisconnectRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          console.log(`Attempting to reconnect... (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_INTERVAL) as unknown as NodeJS.Timeout;
        } else {
          console.log('Max reconnection attempts reached or manual disconnect');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({
          ...prev,
          isConnected: false,
          error: 'Connection error',
          isConnecting: false
        }));
      };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to connect',
        isConnecting: false
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      matchData: null,
      roundData: null,
      roundResult: null,
      matchEndData: null
    }));
  }, []);

  const sendMessage = useCallback((type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type,
        data,
        timestamp: Date.now()
      };
      
      console.log('Sending message:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected, readyState:', wsRef.current?.readyState);
    }
  }, []);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    // Log all important messages
    if (message.type === 'SHOW_RESULTS' || message.type === 'OPPONENT_FINISHED' || message.type === 'ERROR' || message.type === 'ROUND_CATEGORY') {
      console.log('📨 Received:', message.type, message.data);
    }
    
    // Always log SHOW_RESULTS for debugging
    if (message.type === 'SHOW_RESULTS') {
      console.log('🎯 SHOW_RESULTS received in handleMessage:', message.data);
    }

    switch (message.type) {
      case WEBSOCKET_EVENTS.WELCOME:
        // Server welcome message
        break;

      case WEBSOCKET_EVENTS.MATCH_FOUND:
        setState(prev => ({
          ...prev,
          matchData: message.data,
          isPlayerReady: false
        }));
        break;

      case WEBSOCKET_EVENTS.PLAYER_READY:
        // Another player is ready
        break;

      case WEBSOCKET_EVENTS.ROUND_START:
        setState(prev => ({
          ...prev,
          roundData: null,
          roundResult: null,
          timeRemaining: 0
        }));
        break;

      case WEBSOCKET_EVENTS.ROUND_CATEGORY:
        setState(prev => ({
          ...prev,
          roundData: message.data,
          timeRemaining: 15000 // 15 seconds per round
        }));
        break;

      case WEBSOCKET_EVENTS.TIME_WARNING:
        console.log('🎮 TIME_WARNING received:', message.data);
        // Check if this is an opponent finish notification
        if (message.data.message && (message.data.message.includes('opponent') || message.data.message.includes('Opponent'))) {
          setState(prev => ({
            ...prev,
            opponentFinished: true,
            showOpponentFinishAnimation: true,
            timeRemaining: message.data.timeRemaining * 1000 || 15000 // Convert to milliseconds
          }));
          
          // Hide animation after 4 seconds
          setTimeout(() => {
            setState(prev => ({
              ...prev,
              showOpponentFinishAnimation: false
            }));
          }, 4000);
        } else {
          setState(prev => ({
            ...prev,
            timeRemaining: message.data.timeRemaining
          }));
        }
        break;

      case WEBSOCKET_EVENTS.ROUND_END:
        setState(prev => ({
          ...prev,
          timeRemaining: message.data.timeRemaining
        }));
        break;

      case WEBSOCKET_EVENTS.ROUND_RESULT:
        setState(prev => ({
          ...prev,
          roundResult: message.data,
          timeRemaining: 0,
          opponentFinished: false,
          showOpponentFinishAnimation: false
        }));
        break;

      case WEBSOCKET_EVENTS.SHOW_RESULTS:
        console.log('🎯 SHOW_RESULTS received in WebSocket hook:', message.data);
        console.log('🎯 Setting roundResult to:', message.data.roundResult);
        console.log('🎯 Setting matchData to:', message.data.matchData);
        setState(prev => ({
          ...prev,
          roundResult: message.data.roundResult,
          matchData: message.data.matchData,
          showResults: true,
          timeRemaining: 0,
          opponentFinished: false,
          showOpponentFinishAnimation: false
        }));
        console.log('🎯 State updated with roundResult and showResults set to true');
        break;

      case WEBSOCKET_EVENTS.BOTH_PLAYERS_READY_FOR_RESULTS:
        console.log('🎯 BOTH_PLAYERS_READY_FOR_RESULTS received:', message.data);
        setState(prev => ({
          ...prev,
          bothPlayersReadyForResults: true,
          resultsDelay: message.data?.delay || 2500,
          // If server includes roundResult in this event, adopt it immediately
          roundResult: message.data?.roundResult ?? prev.roundResult,
          matchData: message.data?.matchData ?? prev.matchData,
          showResults: Boolean(message.data?.roundResult) || prev.showResults,
          timeRemaining: 0,
          opponentFinished: false,
          showOpponentFinishAnimation: false
        }));
        break;

      case WEBSOCKET_EVENTS.OPPONENT_FINISHED:
        setState(prev => ({
          ...prev,
          opponentFinished: true,
          showOpponentFinishAnimation: true,
          opponentFinishedData: message.data,
          timeRemaining: message.data.timeRemaining || 15000
        }));
        
        // Hide animation after 4 seconds and start countdown
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            showOpponentFinishAnimation: false
          }));
        }, 4000);
        break;

      case WEBSOCKET_EVENTS.MATCH_END:
        setState(prev => ({
          ...prev,
          matchEndData: message.data
        }));
        break;

      case WEBSOCKET_EVENTS.ERROR:
        Alert.alert('Error', message.data.message);
        setState(prev => ({
          ...prev,
          error: message.data.message
        }));
        break;

      case WEBSOCKET_EVENTS.PLAYER_DISCONNECTED:
        setState(prev => ({
          ...prev,
          playerDisconnected: message.data.playerId
        }));
        break;

      case WEBSOCKET_EVENTS.PLAYER_RECONNECTED:
        setState(prev => ({
          ...prev,
          playerDisconnected: null
        }));
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }, []);

  // WebSocket Actions
  const joinQueue = useCallback(() => {
    if (playerId && username && avatar) {
      sendMessage(WEBSOCKET_EVENTS.JOIN_QUEUE, {
        playerId,
        username,
        avatar
      });
    }
  }, [playerId, username, avatar, sendMessage]);

  const sendPlayerReady = useCallback(() => {
    console.log('🎮 sendPlayerReady called');
    console.log('🎮 matchData:', state.matchData);
    console.log('🎮 playerId:', playerId);
    
    if (state.matchData) {
      console.log('🎮 Sending PLAYER_READY message');
      sendMessage(WEBSOCKET_EVENTS.PLAYER_READY, {
        matchId: state.matchData.matchId,
        playerId
      });
      
      setState(prev => ({ ...prev, isPlayerReady: true }));
    } else {
      console.error('🎮 No matchData available for PLAYER_READY');
    }
  }, [state.matchData, playerId, sendMessage]);

  const submitAnswer = useCallback((questionId: string, answer: string, timeTaken: number) => {
    if (state.matchData) {
      sendMessage(WEBSOCKET_EVENTS.SUBMIT_ANSWER, {
        matchId: state.matchData.matchId,
        playerId,
        questionId,
        answer,
        timeTaken
      });
    }
  }, [state.matchData, playerId, sendMessage]);

  const sendFinishedQuiz = useCallback((score: number) => {
    // Use the current matchData from state or fallback to initialMatchData
    const currentMatchData = state.matchData || initialMatchData;
    
    console.log('🎯 sendFinishedQuiz called with score:', score);
    //console.log('🎯 currentMatchData:', currentMatchData);
    //console.log('🎯 playerId:', playerId);
    
    if (currentMatchData?.matchId && playerId) {
      console.log('🎯 Sending FINISHED_QUIZ message');
      sendMessage(WEBSOCKET_EVENTS.FINISHED_QUIZ, {
        matchId: currentMatchData.matchId,
        playerId,
        score
      });
    } else {
      //console.warn('🎯 Cannot send FINISHED_QUIZ - missing matchData or playerId');
    }
  }, [state.matchData, initialMatchData, playerId, sendMessage]);

  const sendReadyForNextRound = useCallback(() => {
    const currentMatchData = state.matchData || initialMatchData;
    
    //console.log('🎯 sendReadyForNextRound called');
    //console.log('🎯 currentMatchData:', currentMatchData);
    //console.log('🎯 playerId:', playerId);
    
    if (currentMatchData?.matchId && playerId) {
      console.log('🎯 Sending READY_FOR_NEXT_ROUND message');
      sendMessage(WEBSOCKET_EVENTS.READY_FOR_NEXT_ROUND, {
        matchId: currentMatchData.matchId,
        playerId
      });
    } else {
      console.warn('🎯 Cannot send READY_FOR_NEXT_ROUND - missing matchData or playerId');
    }
  }, [state.matchData, initialMatchData, playerId, sendMessage]);

  const sendReadyToViewResults = useCallback(() => {
    const currentMatchData = state.matchData || initialMatchData;

    //console.log('🎯 sendReadyToViewResults called');
    //console.log('🎯 currentMatchData:', currentMatchData);
    //console.log('🎯 playerId:', playerId);

    if (currentMatchData?.matchId && playerId) {
      //console.log('🎯 Sending READY_TO_VIEW_RESULTS message');
      sendMessage(WEBSOCKET_EVENTS.READY_TO_VIEW_RESULTS, {
        matchId: currentMatchData.matchId,
        playerId
      });
    } else {
      console.warn('🎯 Cannot send READY_TO_VIEW_RESULTS - missing matchData or playerId');
    }
  }, [state.matchData, initialMatchData, playerId, sendMessage]);

  const reconnect = useCallback(() => {
    if (playerId) {
      sendMessage(WEBSOCKET_EVENTS.RECONNECT, {
        playerId
      });
    }
  }, [playerId, sendMessage]);

  // Auto-connect when player data is available (with delay for stability)
  useEffect(() => {
    if (playerId && username && avatar && !state.isConnected && !state.isConnecting) {
      // Add a small delay to ensure connection stability
      const connectTimeout = setTimeout(() => {
        connect();
      }, 500);
      
      return () => clearTimeout(connectTimeout);
    }
  }, [playerId, username, avatar, state.isConnected, state.isConnecting, connect]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Timer countdown
  useEffect(() => {
    if (state.timeRemaining > 0) {
      const timer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          timeRemaining: Math.max(0, prev.timeRemaining - 1000)
        }));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [state.timeRemaining]);

  return {
    // State
    ...state,
    
    // Actions
    connect,
    disconnect,
    joinQueue,
    sendPlayerReady,
    submitAnswer,
    sendFinishedQuiz,
    sendReadyForNextRound,
    sendReadyToViewResults,
    reconnect,
    
    // Utilities
    sendMessage
  };
};
