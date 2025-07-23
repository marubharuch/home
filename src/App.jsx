import React, { useEffect, useState } from "react";
import { loadAndCacheAllJson } from "./utils/jsonLoader";
import SearchBar from "./components/SearchBar";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    loadAndCacheAllJson()
      .then(({ errors }) => {
        if (errors.length > 0) {
          setLoadError(`${errors.length} files failed to load`);
          console.error('Failed files:', errors);
        }
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4">⏳ Loading data...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-bold p-4 text-center">Universal Item Search</h1>
      {loadError && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-2 mb-4">
          Warning: {loadError}
        </div>
      )}
      <SearchBar />
    </div>
  );
}