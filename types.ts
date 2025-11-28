export enum NodeType {
  ENTITY = 'ENTITY',
  ATTRIBUTE = 'ATTRIBUTE',
  RELATIONSHIP = 'RELATIONSHIP'
}

export interface ERNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
}

export interface ERLink {
  source: string;
  target: string;
  label?: string; // e.g., "1", "N", "M"
}

export interface DiagramData {
  nodes: ERNode[];
  links: ERLink[];
}

export interface TextbookContent {
  title: string;
  definition: string;
  keyPoints: string[];
  example: string;
}
