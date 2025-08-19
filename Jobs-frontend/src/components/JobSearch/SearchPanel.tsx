import React, { useState } from "react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";

const jobTypes = [
  { label: "Remote", value: "remote" },
  { label: "From Office", value: "office" },
  { label: "Hybrid", value: "hybrid" },
];

interface SearchFilters {
  jobTitle: string;
  skills: string[];
  location: string;
  jobType: string;
}

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
          <label className="block text-sm font-medium mb-1">Job Type</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full border rounded px-3 py-2 text-left bg-white dark:bg-neutral-900"
                id="job-type-dropdown-trigger"
              >
                {jobTypes.find(t => t.value === jobType)?.label || "Select Type"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              style={{ width: 'var(--dropdown-trigger-width)' }}
              className="!p-0"
            >
              <div
                ref={el => {
                  if (el) {
                    const trigger = document.getElementById('job-type-dropdown-trigger');
                    if (trigger) {
                      el.style.width = `${trigger.offsetWidth}px`;
                    }
                  }
                }}
              >
                <DropdownMenuItem
                  onSelect={() => setJobType("")}
                  className={jobType === "" ? "font-semibold" : ""}
                >
                  Select Type
                </DropdownMenuItem>
                {jobTypes.map(type => (
                  <DropdownMenuItem
                    key={type.value}
                    onSelect={() => setJobType(type.value)}
                    className={jobType === type.value ? "font-semibold" : ""}
                  >
                    {type.label}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
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