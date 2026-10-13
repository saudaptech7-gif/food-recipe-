import { useEffect, useState } from "react";
import { getFilterOptions } from "../services/recipeApi";

function FilterBar({
  filters,
  onFiltersChange,
  onClear,
  difficulty = "",
  subcategory = "",
  dishType = "",
  onFilterChange,
}) {
  const [options, setOptions] = useState({
    difficulties: [],
    subcategories: [],
    dishTypes: [],
  });

  const [loading, setLoading] = useState(true);

  // Support both the current Home.jsx props
  // and the previous filters/onFiltersChange props.
  const currentFilters = filters || {
    difficulty,
    subcategory,
    dishType,
  };

  const changeFilters =
    onFiltersChange || onFilterChange;

  // =====================================
  // LOAD FILTER OPTIONS
  // =====================================

  useEffect(() => {
    let mounted = true;

    const fetchFilterOptions = async () => {
      try {
        const data = await getFilterOptions();

        if (!mounted) return;

        setOptions({
          difficulties: Array.isArray(data?.difficulties)
            ? data.difficulties
            : [],

          subcategories: Array.isArray(data?.subcategories)
            ? data.subcategories
            : [],

          dishTypes: Array.isArray(data?.dishTypes)
            ? data.dishTypes
            : [],
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
    if (typeof changeFilters !== "function") {
      console.error(
        "FilterBar: onFilterChange callback is missing."
      );
      return;
    }

    changeFilters({
      [field]: value,
    });
  };

  // =====================================
  // CURRENT VALUES
  // =====================================

  const currentDifficulty =
    currentFilters?.difficulty || "";

  const currentSubcategory =
    currentFilters?.subcategory || "";

  const currentDishType =
    currentFilters?.dishType || "";

  const hasActiveFilters = Boolean(
    currentDifficulty ||
    currentSubcategory ||
    currentDishType
  );

  // =====================================
  // RENDER
  // =====================================

  return (
    <div className="filter-bar">
      <div className="filter-heading">
        <span>FILTER RECIPES</span>
      </div>

      <div className="filter-controls">
        {/* DIFFICULTY */}

        <select
          value={currentDifficulty}
          onChange={(event) =>
            handleChange(
              "difficulty",
              event.target.value
            )
          }
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

        {/* SUBCATEGORY */}

        <select
          value={currentSubcategory}
          onChange={(event) =>
            handleChange(
              "subcategory",
              event.target.value
            )
          }
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

        {/* DISH TYPE */}

        <select
          value={currentDishType}
          onChange={(event) =>
            handleChange(
              "dishType",
              event.target.value
            )
          }
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

        {/* CLEAR FILTERS */}

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