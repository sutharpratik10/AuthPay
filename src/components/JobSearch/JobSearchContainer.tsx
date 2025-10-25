"use client";

import React, { useState } from "react";
import SearchPanel from "./Content";
import JobList from "./JobList";
import type { SearchFilters } from "./types";
const JobSearchContainer: React.FC = () => {
  const [searchFilters, setSearchFilters] = useState<SearchFilters | undefined>(undefined);

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
  };

  return (
      <div className="">
        <div className="mb-8">
          <SearchPanel onSearch={handleSearch} />
        </div>
        <JobList searchFilters={searchFilters} />
      </div>
  );
};

export default JobSearchContainer;
