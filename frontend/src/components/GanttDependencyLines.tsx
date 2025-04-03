import React from 'react';

type Dependency = {
  fromId: string;
  toId: string;
};

type Props = {
  dependencies: Dependency[];
};

const GanttDependencyLines = ({ dependencies }: Props) => {
  const fromEl = (id: string) =>
    document.querySelector(`[data-task-id="${id}"]`) as HTMLElement;

  const getLine = (from: HTMLElement, to: HTMLElement) => {
    const fromBox = from.getBoundingClientRect();
    const toBox = to.getBoundingClientRect();

    const svgBox = document.querySelector('#gantt-lines')?.getBoundingClientRect();
    if (!svgBox) return null;

    const x1 = fromBox.right - svgBox.left;
    const y1 = fromBox.top + fromBox.height / 2 - svgBox.top;
    const x2 = toBox.left - svgBox.left;
    const y2 = toBox.top + toBox.height / 2 - svgBox.top;

    return { x1, y1, x2, y2 };
  };

  return (
    <svg
      id="gantt-lines"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      {dependencies.map(({ fromId, toId }, idx) => {
        const from = fromEl(fromId);
        const to = fromEl(toId);
        if (!from || !to) return null;

        const coords = getLine(from, to);
        if (!coords) return null;

        const { x1, y1, x2, y2 } = coords;

        return (
          <line
            key={idx}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#0d6efd"
            strokeWidth={2}
            markerEnd="url(#arrow)"
          />
        );
      })}

      <defs>
        <marker
          id="arrow"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill="#0d6efd" />
        </marker>
      </defs>
    </svg>
  );
};

export default GanttDependencyLines;
