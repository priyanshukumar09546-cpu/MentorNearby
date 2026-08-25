import React, { useState, useEffect } from 'react';

const SearchFilters = ({ initialFilters = {}, onSearch, onReset, loading }) => {
  const [filterState, setFilterState] = useState({
    location: initialFilters.location || '',
    subject: initialFilters.subject || '',
    class: initialFilters.class || '',
    board: initialFilters.board || '',
    medium: initialFilters.medium || '',
    maxFee: initialFilters.maxFee || '',
    verifiedOnly: initialFilters.verifiedOnly === 'true' || false,
  });

  useEffect(() => {
    setFilterState({
      location: initialFilters.location || '',
      subject: initialFilters.subject || '',
      class: initialFilters.class || '',
      board: initialFilters.board || '',
      medium: initialFilters.medium || '',
      maxFee: initialFilters.maxFee || '',
      verifiedOnly: initialFilters.verifiedOnly === 'true' || false,
    });
  }, [initialFilters]);

  const handleChange = (field, value) => {
    setFilterState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    onSearch(filterState);
  };

  const handleReset = () => {
    const resetState = {
      location: '',
      subject: '',
      class: '',
      board: '',
      medium: '',
      maxFee: '',
      verifiedOnly: false,
    };
    setFilterState(resetState);
    if (onReset) onReset();
  };

  return (
    <div className="search-filter-card">
      {/* Header with Search Filters title and Reset button */}
      <div className="search-filter-header">
        <h3 className="search-filter-title">Search Filters</h3>
        <button
          type="button"
          onClick={handleReset}
          className="search-filter-reset"
        >
          Reset
        </button>
      </div>

      <form onSubmit={handleFormSubmit}>
        {/* Location */}
        <div className="search-filter-group">
          <label className="search-filter-label">Location</label>
          <input
            type="text"
            className="search-filter-input"
            placeholder="🔎 Enter city or PIN code"
            value={filterState.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </div>

        {/* Subject */}
        <div className="search-filter-group">
          <label className="search-filter-label">Subject</label>
          <input
            type="text"
            className="search-filter-input"
            placeholder="📚 e.g. Mathematics"
            value={filterState.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
          />
        </div>

        {/* Class / Grade */}
        <div className="search-filter-group">
          <label className="search-filter-label">Class / Grade</label>
          <input
            type="text"
            className="search-filter-input"
            placeholder="🎓 e.g. Class 10"
            value={filterState.class}
            onChange={(e) => handleChange('class', e.target.value)}
          />
        </div>

        {/* Board */}
        <div className="search-filter-group">
          <label className="search-filter-label">Board</label>
          <select
            className="search-filter-select bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            value={filterState.board}
            onChange={(e) => handleChange('board', e.target.value)}
          >
            <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="">Any Board</option>
            <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="CBSE">CBSE</option>
            <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="ICSE">ICSE</option>
            <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="State">State Board</option>
            <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="IB">IB / IGCSE</option>
          </select>
        </div>

        {/* Medium */}
        <div className="search-filter-group">
          <label className="search-filter-label">Medium</label>
          <select
            className="search-filter-select bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            value={filterState.medium}
            onChange={(e) => handleChange('medium', e.target.value)}
          >
            <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="">Any Medium</option>
            <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="English">English</option>
            <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Hindi">Hindi</option>
            <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Both">Both</option>
          </select>
        </div>

        {/* Maximum Fee */}
        <div className="search-filter-group">
          <label className="search-filter-label">Maximum Fee</label>
          <input
            type="number"
            min="0"
            className="search-filter-input"
            placeholder="₹ Max Budget"
            value={filterState.maxFee}
            onChange={(e) => handleChange('maxFee', e.target.value)}
          />
        </div>

        {/* Verified Checkbox */}
        <div className="search-filter-group">
          <label className="search-filter-checkbox-label">
            <input
              type="checkbox"
              className="search-filter-checkbox"
              checked={filterState.verifiedOnly}
              onChange={(e) => handleChange('verifiedOnly', e.target.checked)}
            />
            <span>Verified Tutors Only</span>
          </label>
        </div>

        {/* Primary CTA Search Button */}
        <button
          type="submit"
          disabled={loading}
          className="search-cta-button"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Searching...</span>
            </>
          ) : (
            <>
              <span>🔍</span>
              <span>Search Tutors</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default SearchFilters;
