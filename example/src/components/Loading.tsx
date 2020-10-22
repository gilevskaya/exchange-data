import * as React from 'react';
import 'styled-components/macro';

const BG = 'bg-black-600';

export const Loading = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="lds-facebook">
        <div className={`${BG}`}></div>
        <div className={`${BG}`}></div>
        <div className={`${BG}`}></div>
      </div>
    </div>
  );
};
