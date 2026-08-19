import Invitation from "./invitation";
import { getPublishedInvitation } from "@/lib/invitation-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const content = await getPublishedInvitation();
  return <Invitation content={content} />;
}
