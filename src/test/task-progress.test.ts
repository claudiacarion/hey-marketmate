import { describe, it, expect } from "vitest";
import { doneKeys, filterTasks, progress, taskKey } from "@/lib/task-progress";
describe("task progress", () => {
  it("5 of 12 completed", () => expect(progress(12, new Set([0,1,2,3,4]))).toEqual({ completed: 5, total: 12, percent: 42 }));
  it("To do shows only incomplete", () => expect(filterTasks(3, new Set([1]), "todo")).toEqual([0, 2]));
  it("Completed shows only done", () => expect(filterTasks(3, new Set([1]), "done")).toEqual([1]));
  it("marks only the ticked campaign task done", () => {
    const s = doneKeys([{ campaign_id: "a", task_index: 2 }, { campaign_id: "b", task_index: 0 }]);
    expect(s.has(taskKey("a", 2))).toBe(true);
    expect(s.has(taskKey("a", 1))).toBe(false);
    expect(s.has(taskKey("b", 1))).toBe(false);
    expect(s.size).toBe(2);
  });
});
