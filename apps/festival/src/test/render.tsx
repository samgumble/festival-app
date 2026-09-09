import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { buildRoutes } from "@/app/router";

export function renderAt(path: string) {
  const router = createMemoryRouter(buildRoutes(), { initialEntries: [path] });
  return { router, ...render(<RouterProvider router={router} />) };
}
