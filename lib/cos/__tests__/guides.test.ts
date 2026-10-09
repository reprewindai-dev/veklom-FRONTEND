import { existsSync } from "node:fs";
import { join } from "node:path";
import { stageGuides } from "@/lib/cos/guides";
import { navGroups } from "@/lib/cos/nav";
import { stages } from "@/lib/cos/stages";

const pageExists = (route: string) => existsSync(join(process.cwd(), "app", ...route.split("/").filter(Boolean), "page.tsx"));

describe("page guides", () => {
  it("every page in the navigation tells a first-time visitor how to use it", () => {
    const navIds = navGroups.flatMap((group) => group.items.map((item) => item.id));
    const missing = navIds.filter((id) => !stageGuides[id as keyof typeof stageGuides]);
    expect(missing).toEqual([]);
  });

  it("every 'Next' link points to a page that exists", () => {
    const broken = Object.entries(stageGuides)
      .filter(([, guide]) => guide?.next && !pageExists(guide.next.route))
      .map(([id, guide]) => `${id} -> ${guide?.next?.route}`);
    expect(broken).toEqual([]);
  });

  it("guides only exist for real stages", () => {
    const ids = new Set(stages.map((stage) => stage.id));
    expect(Object.keys(stageGuides).filter((id) => !ids.has(id as never))).toEqual([]);
  });
});
