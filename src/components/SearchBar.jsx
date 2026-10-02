import { useState } from "react";

function SearchBar({ onSearch }) {
  const [search, setSearch] = useState("");
  const [shake, setShake] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Agar input empty hai
    if (!search.trim()) {
      setShake(true);

      // Animation dobara trigger karne ke liye
      setTimeout(() => {
        setShake(false);
      }, 400);

      return;
    }

    // Normal search
    onSearch(search.trim());
  };

  return (
    <form
      className={`search-bar ${shake ? "search-shake" : ""}`}
      onSubmit={handleSubmit}
    >
      <input
        type="text"
        placeholder="Search recipes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <button type="submit">Search</button>
    </form>
  );
}

export default SearchBar;
