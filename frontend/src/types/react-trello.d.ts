// src/types/react-trello.d.ts
declare module 'react-trello' {
    import { ReactNode } from 'react';
  
    export interface CardMetadata {
      [key: string]: any;
    }
  
    export interface CardProps {
      id: string;
      title: string;
      description?: string;
      label?: string;
      tags?: Array<{
        title: string;
        color: string;
      }>;
      draggable?: boolean;
      metadata?: CardMetadata;
      [key: string]: any;
    }
  
    export interface LaneProps {
      id: string;
      title: string;
      label?: string;
      cards?: CardProps[];
      style?: React.CSSProperties;
      [key: string]: any;
    }
  
    export interface BoardProps {
      data: {
        lanes: LaneProps[];
      };
      style?: React.CSSProperties;
      draggable?: boolean;
      laneDraggable?: boolean;
      cardsMoveOnDragOver?: boolean;
      hideCardDeleteIcon?: boolean;
      onCardMoveAcrossLanes?: (cardId: string, sourceLaneId: string, targetLaneId: string) => void;
      components?: {
        Card?: React.ComponentType<any>;
        [key: string]: any;
      };
      [key: string]: any;
    }
  
    const Board: React.FC<BoardProps>;
    export default Board;
  }