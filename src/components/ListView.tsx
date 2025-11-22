// In src/components/ListView.tsx
import { Collection, Text } from '@aws-amplify/ui-react';
import { type Surplus } from './Dashboard';
import { SurplusCard } from './SurplusCard';

type ListViewProps = {
  surpluses: Surplus[];
  handleClaim: (surplusId: string) => void;
  claimingId: string | null;
};

export function ListView({ surpluses, handleClaim, claimingId }: ListViewProps) {
  if (surpluses.length === 0) {
    return <Text>No food surpluses are available at the moment. Check back soon!</Text>;
  }

  return (
    <Collection
      type="grid"
      items={surpluses}
      templateColumns={{ base: "1fr", medium: "1fr 1fr", large: "1fr 1fr 1fr" }}
      gap="medium"
    >
      {(item) => (
        <SurplusCard
          key={item.surplusId}
          surplus={item}
          onClaim={handleClaim}
          isClaiming={claimingId === item.surplusId}
        />
      )}
    </Collection>
  );
}