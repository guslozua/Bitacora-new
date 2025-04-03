import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

type Props = {
  value: number;
  size?: number;
};

const ProgressCircle: React.FC<Props> = ({ value, size = 40 }) => {
  return (
    <div style={{ width: size, height: size }}>
      <CircularProgressbar
        value={value}
        text={`${value}%`}
        strokeWidth={10}
        styles={buildStyles({
          textSize: '30px',
          pathColor:
            value < 40 ? '#dc3545' : value < 80 ? '#ffc107' : '#28a745',
          textColor: '#343a40',
          trailColor: '#e0e0e0',
        })}
      />
    </div>
  );
};

export default ProgressCircle;
