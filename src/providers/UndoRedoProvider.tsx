'use client';

import React, { useState, createContext, useContext, ReactNode } from 'react';

interface Operation {
  id: string;
  type: 'addMember' | 'updateMember' | 'deleteMember' | 'addConnection' | 'updateConnection' | 'deleteConnection';
  data: any;
  timestamp: number;
  inverse?: Partial<Operation>; // For undo operation, only needs type and data
}

interface UndoRedoContextType {
  operations: Operation[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  addOperation: (operation: Omit<Operation, 'id' | 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
}

const UndoRedoContext = createContext<UndoRedoContextType | undefined>(undefined);

export const useUndoRedo = () => {
  const context = useContext(UndoRedoContext);
  if (!context) {
    throw new Error('useUndoRedo must be used within an UndoRedoProvider');
  }
  return context;
};

interface UndoRedoProviderProps {
  children: ReactNode;
  maxHistory?: number;
}

const UndoRedoProvider: React.FC<UndoRedoProviderProps> = ({ 
  children, 
  maxHistory = 50 
}) => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < operations.length - 1;

  const addOperation = (operation: Omit<Operation, 'id' | 'timestamp'>) => {
    const newOperation: Operation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    // Truncate history if we're not at the end
    const truncatedHistory = operations.slice(0, historyIndex + 1);
    
    // Add new operation
    const newHistory = [...truncatedHistory, newOperation];
    
    // Limit history size
    if (newHistory.length > maxHistory) {
      newHistory.shift(); // Remove oldest operation
      setHistoryIndex(maxHistory - 1);
    } else {
      setHistoryIndex(newHistory.length - 1);
    }

    setOperations(newHistory);
  };

  const undo = () => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
      // The actual undo logic will be handled by the components
      // that subscribe to the history index changes
    }
  };

  const redo = () => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
      // The actual redo logic will be handled by the components
      // that subscribe to the history index changes
    }
  };

  const clearHistory = () => {
    setOperations([]);
    setHistoryIndex(-1);
  };

  const value = {
    operations,
    historyIndex,
    canUndo,
    canRedo,
    addOperation,
    undo,
    redo,
    clearHistory
  };

  return (
    <UndoRedoContext.Provider value={value}>
      {children}
    </UndoRedoContext.Provider>
  );
};

export default UndoRedoProvider;