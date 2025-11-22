// In src/components/MyDonationsView.tsx
import { Card, Flex, Heading, Text, Badge, Tabs } from '@aws-amplify/ui-react';
import { type Surplus } from './Dashboard';

type MyDonationsViewProps = {
  myDonations: Surplus[];
};

export function MyDonationsView({ myDonations }: MyDonationsViewProps) {
  const activeDonations = (myDonations || []).filter(d => !(d.status === 'claimed' || d.status === 'fulfilled' || d.claimerInfo));
  const fulfilledDonations = (myDonations || []).filter(d => (d.status === 'claimed' || d.status === 'fulfilled' || d.claimerInfo));

  if (!myDonations || myDonations.length === 0) {
    return <Text>You have not made any donations yet.</Text>;
  }

  return (
    <Tabs
      defaultValue="active"
      items={[
        {
          label: `Active (${activeDonations.length})`,
          value: 'active',
          content: (
            <Flex direction="column" gap="medium" marginTop="medium">
              {activeDonations.length > 0 ? (
                activeDonations.map(item => (
                  <Card key={item.surplusId} variation="outlined">
                    <Flex direction="row" justifyContent="space-between" alignItems="center">
                      <div>
                        <Heading level={5}>{item.foodType} (Qty: {item.quantity})</Heading>
                        {item.address && <Text variation="tertiary">{item.address}</Text>}
                        {item.expirationDate && <Text variation="tertiary">Expires: {item.expirationDate}</Text>}
                      </div>
                      <Badge variation="info">{item.status ?? 'available'}</Badge>
                    </Flex>
                  </Card>
                ))
              ) : (
                <Text>You have no active donations.</Text>
              )}
            </Flex>
          )
        },
        {
          label: `History (${fulfilledDonations.length})`,
          value: 'history',
          content: (
            <Flex direction="column" gap="medium" marginTop="medium">
              {fulfilledDonations.length > 0 ? (
                fulfilledDonations.map(item => (
                  <Card key={item.surplusId} variation="elevated">
                    <Flex direction="column" gap="small">
                      <Flex direction="row" justifyContent="space-between" alignItems="center">
                        <Heading level={5}>{item.foodType} (Qty: {item.quantity})</Heading>
                        <Badge variation="success">{item.status ?? 'fulfilled'}</Badge>
                      </Flex>

                      {item.claimerInfo ? (
                        <Card variation="elevated">
                          <Heading level={6}>Picked up by:</Heading>
                          <Text><strong>Name:</strong> {item.claimerInfo.name}</Text>
                          <Text><strong>Phone:</strong> {item.claimerInfo.phoneNumber}</Text>
                        </Card>
                      ) : (
                        <Text variation="tertiary">No pickup details available.</Text>
                      )}
                    </Flex>
                  </Card>
                ))
              ) : (
                <Text>No donation history yet.</Text>
              )}
            </Flex>
          )
        }
      ]}
    />
  );
}