import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { searchTutors } from '../api/search';

export function useSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const filters = Object.fromEntries(searchParams.entries());

  const setFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const resetFilters = () => setSearchParams(new URLSearchParams());
  const setPage = (p) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', p);
    setSearchParams(newParams);
  };

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await searchTutors(filters);
        setResults(res.data.data?.tutors || []);
        setTotal(res.data.data?.total || 0);
      } catch (err) {
        setError(err.message || 'Error fetching results');
      } finally {
        setLoading(false);
      }
    };
    const timeoutId = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [searchParams]);

  return { filters, setFilter, results, loading, error, total, page, setPage, resetFilters };
}
