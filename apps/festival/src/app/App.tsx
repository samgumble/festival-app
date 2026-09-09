import { Content } from "@bb/shared";
import bundled from "@/data/bundled.json";

const content = Content.parse(bundled);

export function App() {
  return (
    <h1>
      {content.festival.name} — {content.artists.length} artists, {content.sets.length} sets
    </h1>
  );
}
