
import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-md flex items-center justify-center">
        <span className="text-white font-bold text-lg">C</span>
      </div>
      <span className="font-bold text-xl text-gray-800">
        Competitor<span className="text-blue-600">Scope</span>
      </span>
    </div>
  );
};

export default Logo;
