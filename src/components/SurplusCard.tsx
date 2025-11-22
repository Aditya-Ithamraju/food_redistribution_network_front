// In src/components/SurplusCard.tsx
import { useState, useEffect } from 'react';
import { get } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth'; // <-- ADD this import
import { Card, Heading, Text, View, Button, Image, Flex, Loader } from '@aws-amplify/ui-react';
import { type Surplus } from './Dashboard';

type DisplayUrlResponse = {
  url: string;
};

type SurplusCardProps = {
  surplus: Surplus;
  onClaim: (surplusId: string) => void;
  isClaiming: boolean;
};

export function SurplusCard({ surplus, onClaim, isClaiming }: SurplusCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);

  useEffect(() => {
    const fetchImageUrl = async () => {
      if (surplus.imageKey) {
        try {
          // --- THIS IS THE FINAL FIX ---
          // 1. Get the user's authentication token
          const { idToken } = (await fetchAuthSession()).tokens ?? {};
          if (!idToken) throw new Error("User not authenticated");

          // 2. Make the API call WITH the token in the headers
          const restOperation = get({
            apiName: 'FoodWasteAPI',
            path: '/display-url',
            options: {
              queryParams: {
                key: surplus.imageKey
              },
              headers: {
                Authorization: idToken.toString() // <-- Add the token here
              }
            }
          });
          
          const { body } = await restOperation.response;
          const { url } = await body.json() as DisplayUrlResponse;
          setImageUrl(url);

        } catch (err) {
          console.error(`Error fetching display URL for key ${surplus.imageKey}:`, err);
        } finally {
          setIsLoadingImage(false);
        }
      } else {
        setIsLoadingImage(false);
      }
    };

    fetchImageUrl();
  }, [surplus.imageKey]);

  return (
    <Card variation="outlined">
      <Flex direction="column" gap="small">
        <View height="150px" backgroundColor="background.secondary" borderRadius="small" style={{ overflow: 'hidden' }}>
          {isLoadingImage ? (
            <Flex justifyContent="center" alignItems="center" height="100%">
              <Loader />
            </Flex>
          ) : imageUrl ? (
            <Image src={imageUrl} alt={surplus.foodType} width="100%" height="100%" objectFit="cover" />
          ) : (
             <Flex justifyContent="center" alignItems="center" height="100%">
              <Text>No Image</Text>
            </Flex>
          )}
        </View>
        <View paddingInline="small">
          <Heading level={5}>{surplus.foodType}</Heading>
          {surplus.donorInfo && (
            <Text fontSize="small" variation="tertiary">
              By: {surplus.donorInfo.name} ({surplus.donorInfo.phoneNumber})
            </Text>
          )}
          <Text>Quantity: {surplus.quantity}</Text>
          <Text>Expires on: {surplus.expirationDate}</Text>
          <Text fontSize="small">Location: {surplus.address}</Text>
          <Button 
            variation="primary" 
            onClick={() => onClaim(surplus.surplusId)}
            isLoading={isClaiming}
            isFullWidth 
            marginTop="medium"
          >
            Claim
          </Button>
        </View>
      </Flex>
    </Card>
  );
}