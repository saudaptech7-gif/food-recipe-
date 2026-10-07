import { useEffect, useState } from "react";

import { getFilterOptions } from "../services/recipeApi";

function FilterBar({ filters, onFiltersChange, onClear }) {
  const [options, setOptions] = useState({
    difficulties: [],
    subcategories: [],
    dishTypes: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoading(true);

        const data = await getFilterOptions();

        setOptions({
          difficulties: data?.difficulties || [],

          subcategories: data?.subcategories || [],

          dishTypes: data?.dishTypes || [],
        });
      } catch (error) {
        console.error("Filter options error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleChange = (field, value) => {
    onFiltersChange({
      [field]: value,
    });
  };

  const hasActiveFilters = Boolean(
    filters?.difficulty || filters?.subcategory || filters?.dishType,
  );

  return (
    <div className="filter-bar">
      <div className="filter-heading">
        <span>FILTER RECIPES</span>
      </div>

      <div className="filter-controls">
        {/* DIFFICULTY */}

        <select
          value={filters?.difficulty || ""}
          onChange={(e) => handleChange("difficulty", e.target.value)}
          disabled={loading}
        >
          <option value="">All Difficulties</option>

          {options.difficulties.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        {/* SUBCATEGORY */}

        <select
          value={filters?.subcategory || ""}
          onChange={(e) => handleChange("subcategory", e.target.value)}
          disabled={loading}
        >
          <option value="">All Subcategories</option>

          {options.subcategories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        {/* DISH TYPE */}

        <select
          value={filters?.dishType || ""}
          onChange={(e) => handleChange("dishType", e.target.value)}
          disabled={loading}
        >
          <option value="">All Dish Types</option>

          {options.dishTypes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        {/* CLEAR */}

        <button
          type="button"
          className={`filter-clear-button ${
            hasActiveFilters ? "has-filters" : ""
          }`}
          onClick={onClear}
          disabled={!hasActiveFilters}
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}

export default FilterBar;
