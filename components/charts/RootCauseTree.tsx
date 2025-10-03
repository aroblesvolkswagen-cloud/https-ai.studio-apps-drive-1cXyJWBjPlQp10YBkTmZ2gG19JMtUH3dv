import React from 'react';
import { ICONS } from '../../constants';

export interface RootCauseData {
  problem: string;
  categories: {
    name: string;
    causes: string[];
  }[];
}

interface RootCauseTreeProps {
  data: RootCauseData;
  isEditing: boolean;
  onDataChange: (data: RootCauseData) => void;
}

const RootCauseTree: React.FC<RootCauseTreeProps> = ({ data, isEditing, onDataChange }) => {
  const handleProblemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDataChange({ ...data, problem: e.target.value });
  };

  const handleCategoryNameChange = (catIndex: number, value: string) => {
    const newCategories = [...data.categories];
    newCategories[catIndex].name = value;
    onDataChange({ ...data, categories: newCategories });
  };

  const handleCauseChange = (catIndex: number, causeIndex: number, value: string) => {
    const newCategories = [...data.categories];
    newCategories[catIndex].causes[causeIndex] = value;
    onDataChange({ ...data, categories: newCategories });
  };
  
  const addCause = (catIndex: number) => {
    const newCategories = [...data.categories];
    newCategories[catIndex].causes.push("Nueva Causa");
    onDataChange({ ...data, categories: newCategories });
  }

  const removeCause = (catIndex: number, causeIndex: number) => {
    const newCategories = [...data.categories];
    newCategories[catIndex].causes.splice(causeIndex, 1);
     onDataChange({ ...data, categories: newCategories });
  }

  return (
    <div className="p-6 glass glass-noise w-full overflow-x-auto printable-area">
      <h3 className="text-lg font-semibold text-center venki-subtitle mb-8">Diagrama de Árbol de Causas Raíz</h3>
      <div className="flex items-center space-x-8 min-w-[1000px]">
        {/* Problem Node */}
        <div className="flex-shrink-0">
          {isEditing ? (
            <input
              type="text"
              value={data.problem}
              onChange={handleProblemChange}
              className="p-3 border-2 border-red-500/50 bg-red-900/50 text-red-200 font-bold rounded-lg text-center input-glass"
            />
          ) : (
            <div className="p-3 glass glass-danger text-red-200 font-bold">
              {data.problem}
            </div>
          )}
        </div>

        {/* Categories and Causes */}
        <div className="flex-grow flex space-x-6">
          {data.categories.map((category, catIndex) => (
            <div key={catIndex} className="flex flex-col items-center space-y-2">
              {/* Category Node */}
              {isEditing ? (
                 <input
                    type="text"
                    value={category.name}
                    onChange={(e) => handleCategoryNameChange(catIndex, e.target.value)}
                    className="p-2 border-2 border-venki-cyan/50 bg-venki-cyan/10 text-venki-cyan font-semibold rounded-md text-center w-32 input-glass"
                />
              ) : (
                <div className="p-2 glass text-venki-cyan font-semibold w-32 text-center">
                  {category.name}
                </div>
              )}
              {/* Causes List */}
              <div className="space-y-2">
                {category.causes.map((cause, causeIndex) => (
                  <div key={causeIndex} className="flex items-center">
                    {isEditing ? (
                      <input
                        type="text"
                        value={cause}
                        onChange={(e) => handleCauseChange(catIndex, causeIndex, e.target.value)}
                        className="px-2 py-1 rounded-md text-sm w-40 input-glass"
                      />
                    ) : (
                      <div className="px-2 py-1 glass text-sm w-40 text-center">{cause}</div>
                    )}
                    {isEditing && (
                        <button onClick={() => removeCause(catIndex, causeIndex)} className="ml-2 text-red-500 hover:text-red-700">{ICONS.Trash}</button>
                    )}
                  </div>
                ))}
                 {isEditing && (
                    <button onClick={() => addCause(catIndex)} className="w-full mt-2 text-sm text-venki-cyan hover:underline">+ Añadir Causa</button>
                 )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RootCauseTree;