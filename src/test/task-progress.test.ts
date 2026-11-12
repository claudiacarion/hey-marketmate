import { describe, it, expect } from "vitest";
import { filterTasks, progress } from "@/lib/task-progress";
describe("task progress", () => {
  it("5 of 12 completed", () => expect(progress(12, new Set([0,1,2,3,4]))).toEqual({ completed: 5, total: 12, percent: 42 }));
  it("To do shows only incomplete", () => expect(filterTasks(3, new Set([1]), "todo")).toEqual([0, 2]));
  it("Completed shows only done", () => expect(filterTasks(3, new Set([1]), "done")).toEqual([1]));
});
