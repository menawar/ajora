"use client";

import { useState, useMemo } from "react";
import type { SaverRow } from "./useTopSavers";

export type SortField = "savings"; // currently only savings is tracked
export type SortOrder = "asc" | "desc";

interface LeaderboardFilterResult {
  query: string;
  setQuery: (q: string) => void;
  sortBy: SortField;
  setSortBy: (s: SortField) => void;
  sortOrder: SortOrder;
  setSortOrder: (o: SortOrder) => void;
  page: number;
  setPage: (p: number) => void;
  filtered: SaverRow[];
  paginated: SaverRow[];
  totalPages: number;
}

export function useLeaderboardFilter(
  rawSavers: SaverRow[],
  itemsPerPage = 10
): LeaderboardFilterResult {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("savings");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let result = [...rawSavers];

    // 1. Filter by address
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (s) => s.address.toLowerCase().includes(q)
      );
    }

    // 2. Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "savings":
          cmp = a.total > b.total ? 1 : a.total < b.total ? -1 : 0;
          break;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return result;
  }, [rawSavers, query, sortBy, sortOrder]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  // Ensure page is within bounds when filtering changes
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  
  const paginated = useMemo(() => {
    return filtered.slice(safePage * itemsPerPage, (safePage + 1) * itemsPerPage);
  }, [filtered, safePage, itemsPerPage]);

  return {
    query,
    setQuery: (q) => { setQuery(q); setPage(0); },
    sortBy,
    setSortBy: (s) => { setSortBy(s); setPage(0); },
    sortOrder,
    setSortOrder: (o) => { setSortOrder(o); setPage(0); },
    page: safePage,
    setPage,
    filtered,
    paginated,
    totalPages,
  };
}
