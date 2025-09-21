import React from "react";
import { Suspense } from "react";
import JobSearchContainer from "@/components/JobSearch/JobSearchContainer";

export default function JobSearchPage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<div>Loading jobs...</div>}>
        <JobSearchContainer />
      </Suspense>
    </div>
  );
}
