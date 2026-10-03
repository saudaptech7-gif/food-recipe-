import { useEffect, useState } from "react";

import { getFilterOptions } from "../services/recipeApi";

function FilterBar({
  difficulty,
  subcategory,
  dishType,
  onFilterChange,
  onClear,
}) {
  const [options, setOptions] = useState({
    difficulties: [],
    subcategories: [],
    dishTypes: [],
  });

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const data = await getFilterOptions();

        setOptions(data);
      } catch (error) {
        console.error(error.message);
      }
    };

    fetchFilterOptions();
  }, []);

  return (
    <div className="filter-bar">
      <select
        value={difficulty}
        onChange={(e) =>
          onFilterChange({
            difficulty: e.target.value,
            subcategory,
            dishType,
          })
        }
      >
        <option value="">All Difficulties</option>

        {options.difficulties.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <select
        value={subcategory}
        onChange={(e) =>
          onFilterChange({
            difficulty,
            subcategory: e.target.value,
            dishType,
          })
        }
      >
        <option value="">All Subcategories</option>

        {options.subcategories.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <select
        value={dishType}
        onChange={(e) =>
          onFilterChange({
            difficulty,
            subcategory,
            dishType: e.target.value,
          })
        }
      >
        <option value="">All Dish Types</option>

        {options.dishTypes.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <button type="button" onClick={onClear}>
        Clear Filters
      </button>
    </div>
  );
}

export default FilterBar;
