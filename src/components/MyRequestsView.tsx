// In src/components/MyRequestsView.tsx
import { Card, Flex, Heading, Text, Badge, Tabs } from '@aws-amplify/ui-react';
import { type FoodRequest } from './Dashboard'; // We'll export this type from Dashboard

type MyRequestsViewProps = {
  myRequests: FoodRequest[];
};

export function MyRequestsView({ myRequests }: MyRequestsViewProps) {
  // 1. Sort your requests into two separate lists
  const activeRequests = myRequests.filter(r => r.status === 'active');
  const fulfilledRequests = myRequests.filter(r => r.status === 'fulfilled');

  if (myRequests.length === 0) {
    return <Text>You have not made any food requests yet.</Text>;
  }

  // 2. Use the Tabs component to display them
  return (
    <Tabs
      defaultValue="active" // Start with the 'Active' tab selected
      items={[
        {
          label: `Active (${activeRequests.length})`,
          value: 'active',
          content: (
            <Flex direction="column" gap="medium" marginTop="medium">
              {activeRequests.length > 0 ? (
                activeRequests.map(item => (
                  <Card key={item.requestId} variation="outlined">
                    <Flex direction="row" justifyContent="space-between">
                      <Heading level={5}>{item.foodType} (Qty: {item.quantity})</Heading>
                      <Badge variation="info">{item.status}</Badge>
                    </Flex>
                    {item.description && <Text variation="tertiary">{item.description}</Text>}
                  </Card>
                ))
              ) : (
                <Text>You have no active requests.</Text>
              )}
            </Flex>
          ),
        },
        {
          label: `History (${fulfilledRequests.length})`,
          value: 'history',
          content: (
            <Flex direction="column" gap="medium" marginTop="medium">
              {fulfilledRequests.length > 0 ? (
                fulfilledRequests.map(item => (
                  <Card key={item.requestId} variation="elevated">
                    <Flex direction="column" gap="small">
                      <Flex direction="row" justifyContent="space-between">
                        <Heading level={5}>{item.foodType} (Qty: {item.quantity})</Heading>
                        <Badge variation="success">{item.status}</Badge>
                      </Flex>
                      {item.donorInfo && (
                        <Card variation="elevated">
                          <Heading level={6}>Fulfilled By:</Heading>
                          <Text><strong>Name:</strong> {item.donorInfo.name}</Text>
                          <Text><strong>Phone:</strong> {item.donorInfo.phoneNumber}</Text>
                        </Card>
                      )}
                    </Flex>
                  </Card>
                ))
              ) : (
                <Text>You have no fulfilled requests yet.</Text>
              )}
            </Flex>
          ),
        },
      ]}
    />
  );
}