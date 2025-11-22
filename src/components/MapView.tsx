// In src/components/MapView.tsx
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Button, Heading, Text, Card, Flex, View } from '@aws-amplify/ui-react';
import { type Surplus, type FoodRequest } from './Dashboard';
import L from 'leaflet';

// --- DEFINE CUSTOM ICONS ---
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// Helper component to handle clicks on the map background
function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({
    click: () => {
      onMapClick();
    },
  });
  return null;
}

type MapViewProps = {
  surpluses: Surplus[];
  requests: FoodRequest[];
  onClaim: (surplusId: string) => Promise<void>;
  claimingId: string | null;
  onFulfill: (requestId: string) => Promise<void>; // <-- NEW PROP
  fulfillingId: string | null;                  // <-- NEW PROP
};

export function MapView({ surpluses, requests, onClaim, claimingId, onFulfill, fulfillingId }: MapViewProps) {
  const [activeItem, setActiveItem] = useState<Surplus | FoodRequest | null>(null);

  const locatedSurpluses = surpluses.filter(s => s.coordinates && s.coordinates.lat && s.coordinates.lng);
  const locatedRequests = requests.filter(r => r.coordinates && r.coordinates.lat && r.coordinates.lng);
  const allLocatedItems = [...locatedSurpluses, ...locatedRequests];

  const defaultCenter: [number, number] = allLocatedItems.length > 0
    ? [allLocatedItems[0].coordinates!.lat, allLocatedItems[0].coordinates!.lng]
    : [12.9716, 77.5946];

  // Helper to check if the active item is a Surplus
  const isSurplus = (item: Surplus | FoodRequest): item is Surplus => 'surplusId' in item;

  return (
    <Card variation="outlined" style={{ position: 'relative' }}>
      <Heading level={4} marginBottom="small">Food Network Map</Heading>
      <Text marginBottom="medium">Blue pins are available donations. Green pins are active requests.</Text>
      
      <div style={{ height: '500px', width: '100%', borderRadius: '6px', overflow: 'hidden' }}>
        <MapContainer center={defaultCenter} zoom={10} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='...' />
          <MapClickHandler onMapClick={() => setActiveItem(null)} />

          {locatedSurpluses.map((surplus) => (
            <Marker 
              key={surplus.surplusId} 
              position={[surplus.coordinates!.lat, surplus.coordinates!.lng]}
              icon={blueIcon}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  setActiveItem(surplus);
                },
              }}
            />
          ))}

          {locatedRequests.map((request) => (
            <Marker 
              key={request.requestId} 
              position={[request.coordinates!.lat, request.coordinates!.lng]}
              icon={greenIcon}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  setActiveItem(request);
                },
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* --- THIS IS THE CUSTOM INFO PANEL --- */}
      {activeItem && (
        <View 
          backgroundColor="white"
          padding="medium"
          borderRadius="medium"
          boxShadow="large"
          position="absolute"
          bottom="20px"
          left="20px"
          right="20px"
          style={{ zIndex: 1000 }}
        >
          <Flex direction="column" gap="small">
            <Flex direction="row" justifyContent="space-between" alignItems="center">
              <Heading level={5}>{isSurplus(activeItem) ? 'Donation:' : 'Request:'} {activeItem.foodType}</Heading>
              <Button size="small" variation="link" onClick={() => setActiveItem(null)}>Close</Button>
            </Flex>
            {isSurplus(activeItem) && activeItem.donorInfo && (
              <Text variation="tertiary">By: {activeItem.donorInfo.name} ({activeItem.donorInfo.phoneNumber})</Text>
            )}
            {!isSurplus(activeItem) && activeItem.requesterInfo && (
              <Text variation="tertiary">By: {activeItem.requesterInfo.name} ({activeItem.requesterInfo.phoneNumber})</Text>
            )}
            <Text><strong>Quantity:</strong> {activeItem.quantity}</Text>
            {isSurplus(activeItem) ? (
              <Text fontSize="small"><strong>Address:</strong> {activeItem.address}</Text>
            ) : (
              activeItem.description && <Text fontSize="small"><strong>Reason:</strong> {activeItem.description}</Text>
            )}

            {isSurplus(activeItem) && (
              <Button 
                variation="primary" 
                width="100%"
                marginTop="small"
                onClick={async () => {
                  await onClaim(activeItem.surplusId);
                  setActiveItem(null);
                }}
                isLoading={claimingId === activeItem.surplusId}
                disabled={!!claimingId}
              >
                {claimingId === activeItem.surplusId ? 'Claiming...' : 'Claim Food'}
              </Button>
            )}
            
            {!isSurplus(activeItem) && (
              <Button 
                variation="primary" 
                width="100%" 
                marginTop="small"
                onClick={async () => {
                  await onFulfill(activeItem.requestId);
                  setActiveItem(null);
                }}
                isLoading={fulfillingId === activeItem.requestId}
                disabled={!!fulfillingId}
              >
                {fulfillingId === activeItem.requestId ? 'Fulfilling...' : 'Fulfill Request'}
              </Button>
            )}
          </Flex>
        </View>
      )}
    </Card>
  );
}