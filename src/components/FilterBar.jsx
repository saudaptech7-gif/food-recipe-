import { useEffect, useState } from "react";

import { getFilterOptions } from "../services/recipeApi";

function FilterBar({ filters, onFiltersChange, onClear }) {
  const [options, setOptions] = useState({
    difficulties: [],
    subcategories: [],
    dishTypes: [],
  });

  const [loading, setLoading] = useState(true);

  // =====================================
  // LOAD FILTER OPTIONS
  // =====================================

  useEffect(() => {
    let mounted = true;

    const fetchFilterOptions = async () => {
      try {
        setLoading(true);

        const data = await getFilterOptions();

        if (!mounted) {
          return;
        }

        const difficulties = Array.isArray(data?.difficulties)
          ? data.difficulties
          : [];

        const subcategories = Array.isArray(data?.subcategories)
          ? data.subcategories
          : [];

        const dishTypes = Array.isArray(data?.dishTypes)
          ? data.dishTypes
          : [];

        setOptions({
          difficulties,
          subcategories,
          dishTypes,
        });
      } catch (error) {
        console.error("Filter options error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchFilterOptions();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================
  // HANDLE CHANGE
  // =====================================

  const handleChange = (field, value) => {
    onFiltersChange({
      [field]: value,
    });
  };

  // =====================================
  // CLEAR FILTERS
  // =====================================

  const hasActiveFilters = Boolean(
    filters?.difficulty ||
      filters?.subcategory ||
      filters?.dishType,
  );

  // =====================================
  // CURRENT VALUES
  // =====================================

  const currentDifficulty = filters?.difficulty || "";
  const currentSubcategory = filters?.subcategory || "";
  const currentDishType = filters?.dishType || "";

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="filter-bar">
      <div className="filter-heading">
        <span>FILTER RECIPES</span>
      </div>

      <div className="filter-controls">

        {/* ================================
            DIFFICULTY
        ================================= */}

        <select
          value={currentDifficulty}
          onChange={(event) => {
            const value = event.target.value;

            console.log("Difficulty selected:", value);

            handleChange("difficulty", value);
          }}
          disabled={loading}
        >
          <option value="">All Difficulties</option>

          {options.difficulties.map((item) => (
            <option
              key={`difficulty-${item}`}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>

        {/* ================================
            SUBCATEGORY
        ================================= */}

        <select
          value={currentSubcategory}
          onChange={(event) => {
            handleChange(
              "subcategory",
              event.target.value,
            );
          }}
          disabled={loading}
        >
          <option value="">All Subcategories</option>

          {options.subcategories.map((item) => (
            <option
              key={`subcategory-${item}`}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>

        {/* ================================
            DISH TYPE
        ================================= */}

        <select
          value={currentDishType}
          onChange={(event) => {
            handleChange(
              "dishType",
              event.target.value,
            );
          }}
          disabled={loading}
        >
          <option value="">All Dish Types</option>

          {options.dishTypes.map((item) => (
            <option
              key={`dish-type-${item}`}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>

        {/* ================================
            CLEAR
        ================================= */}

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

