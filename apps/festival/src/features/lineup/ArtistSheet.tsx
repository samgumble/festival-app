import { useNavigate, useParams } from "react-router";
import { Sheet } from "@/design";

export function ArtistSheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  return <Sheet onClose={() => navigate("/lineup")} title="Artist"><p>{id}</p></Sheet>;
}
