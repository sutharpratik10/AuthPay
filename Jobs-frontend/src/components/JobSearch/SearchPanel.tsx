import React, { useState } from "react";
import { Button } from "../ui/button";

const jobTypes = [
  { label: "Remote", value: "remote" },
  { label: "From Office", value: "office" },
  { label: "Hybrid", value: "hybrid" },
];

import type { SearchFilters } from "./types";

export function SearchPanel({ onSearch }: { onSearch?: (filters: SearchFilters) => void }) {
  const [jobTitle, setJobTitle] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({
        jobTitle,
        skills: skills.split(",").map(s => s.trim()).filter(Boolean),
        location,
        jobType,
      });
    }
  };

  return (
    <form
      className="bg-white dark:bg-neutral-900 rounded-lg shadow p-6 flex flex-col gap-4 mx-auto"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Job Title</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. Frontend Developer"
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Skills</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. React, Node.js, TypeScript"
            value={skills}
            onChange={e => setSkills(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. Mumbai, Remote"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label htmlFor="job-type-select" className="block text-sm font-medium mb-1">Job Type</label>
          <select
            id="job-type-select"
            className="w-full border rounded px-3 py-2"
            value={jobType}
            onChange={e => setJobType(e.target.value)}
          >
            <option value="">Select Type</option>
            {jobTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          className=""
        >
          Search Jobs
        </Button>
      </div>
    </form>
  );
}

export default SearchPanel;