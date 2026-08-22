import React from "react";
import { TextDecoder, TextEncoder } from "util";
import { useApi } from "@/hooks/useApi";
import NexusProtocol from "./NexusProtocol";

Object.defineProperty(globalThis, "TextEncoder", { value: TextEncoder });
Object.defineProperty(globalThis, "TextDecoder", { value: TextDecoder });

const { renderToStaticMarkup } = require("react-dom/server");

jest.mock("@/hooks/useApi", () => ({
  useApi: jest.fn(),
}));

const mockedUseApi = jest.mocked(useApi);

describe("NexusProtocol", () => {
  it("renders an honest degraded state when proof and anchoring are absent", () => {
    mockedUseApi.mockReturnValue({
      data: { cards: [], nodes: [] },
      error: undefined,
      isLoading: false,
    } as ReturnType<typeof useApi>);

    const markup = renderToStaticMarkup(<NexusProtocol />);
    expect(markup).toBeTruthy();
    expect(markup).toContain("No route-backed scorecards returned");
    expect(markup).toContain("Needs proof");
    expect(markup).toContain("ROUTES:");
    expect(markup).toContain("0/0");
    expect(markup).toContain("NO PROOF");
    expect(markup).not.toContain("PARTIAL PROOF");
  });
});
