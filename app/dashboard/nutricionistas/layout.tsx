import { ReactNode } from "react";
import { SubscriptionProvider } from "../../../contexts/subscription-context";
import { getInitialSubscription } from "../../../lib/subscription-server";

export default async function Page({ children }: { children: ReactNode }) {
  const initial = await getInitialSubscription();
  return (
    <SubscriptionProvider initial={initial}>
      {children}
    </SubscriptionProvider>
  );
}
