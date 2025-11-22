// In src/components/RequestFoodModal.tsx
import { useState, useRef, useEffect } from 'react';
import { post } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Geo } from '@aws-amplify/geo';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import { Button, Flex, Heading, TextField, View, SelectField, TextAreaField, Text } from '@aws-amplify/ui-react';
import { toast } from 'sonner';
import type { FormEvent, ChangeEvent } from 'react';

// --- Copied from your working DonateFoodModal.tsx ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;
type Position = { lat: number; lng: number };
function MapResizeFix() { const map = useMap(); useEffect(() => { const timer = setTimeout(() => map.invalidateSize(), 100); return () => clearTimeout(timer); }, [map]); return null; }
function ChangeMapView({ center }: { center: [number, number] }) { const map = useMap(); useEffect(() => { map.flyTo(center, 15) }, [center, map]); return null; }
type LocationMarkerProps = { position: Position | null; setPosition: (pos: LatLng | null) => void; setAddress: (addr: string) => void; };
function LocationMarker({ position, setPosition, setAddress }: LocationMarkerProps) { const map = useMapEvents({ click(e) { setPosition(e.latlng); map.flyTo(e.latlng, map.getZoom()); Geo.searchByCoordinates([e.latlng.lng, e.latlng.lat]).then((result) => { if (result?.label) { setAddress(result.label); } }); } }); return position === null ? null : <Marker position={position} eventHandlers={{ click: () => { setPosition(null); setAddress(''); }, }}></Marker>; }
// --- End of copied helpers ---

type RequestFoodModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onRequestSuccess: () => void;
};

export function RequestFoodModal({ isOpen, onClose, onRequestSuccess }: RequestFoodModalProps) {
  const [formData, setFormData] = useState({ foodType: '', quantity: '', description: '', address: '' });
  const [position, setPosition] = useState<Position | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const { idToken } = (await fetchAuthSession()).tokens ?? {};
      if (!idToken) throw new Error("User not authenticated");

      await post({
        apiName: 'FoodWasteAPI',
        path: '/food-requests',
        options: {
          headers: { Authorization: idToken.toString() },
          body: {
            ...formData,
            quantity: parseInt(formData.quantity, 10),
            coordinates: position
          }
        }
      }).response;

      toast.success("Food request submitted successfully!");
      onRequestSuccess();
      // Reset form state after successful submission
      setFormData({ foodType: '', quantity: '', description: '', address: '' });
      setPosition(null);
      onClose();

    } catch (err) {
      console.error('Request submission failed:', err);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <View style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={onClose}>
      <View backgroundColor="white" padding="large" borderRadius="medium" width={{ base: '90%', large: '600px' }} onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="medium" paddingRight="small">
            <Heading level={3}>Request Food</Heading>
            
            <Text fontSize="small">Optional: Pin a pickup location for your request on the map. Click the pin again to remove it.</Text>
            <View height="250px" width="100%" borderRadius="medium" style={{overflow: 'hidden', border: '1px solid #ccc'}}>
              <MapContainer center={[12.9716, 77.5946]} zoom={11} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker 
                    position={position} 
                    setPosition={(pos) => setPosition(pos ? { lat: pos.lat, lng: pos.lng } : null)}
                    setAddress={(addr: string) => setFormData(p => ({...p, address: addr}))}
                  />
                  {position && <ChangeMapView center={[position.lat, position.lng]} />}
                  <MapResizeFix />
              </MapContainer>
            </View>

            <TextField 
                label="Pickup Location Address (auto-filled by map)"
                value={formData.address}
                readOnly={true}
                placeholder="Address will appear after pinning a location"
            />
            <SelectField label="Food Type" value={formData.foodType} onChange={(e) => setFormData(p => ({...p, foodType: e.target.value}))} required>
              <option value="">Select a food type</option>
              <option value="Fruits">Fruits</option><option value="Vegetables">Vegetables</option><option value="Baked Goods">Baked Goods</option><option value="Canned Goods">Canned Goods</option><option value="Other">Other</option>
            </SelectField>
            <TextField label="Quantity Needed" type="number" placeholder="e.g., 5" value={formData.quantity} onChange={(e) => setFormData(p => ({...p, quantity: e.target.value}))} isRequired />
            <TextAreaField label="Description / Reason" placeholder="Any specific details about your request (optional)" value={formData.description} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData(p => ({...p, description: e.target.value}))} />
            
            <Flex direction="row" gap="small" justifyContent="flex-end">
              <Button type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" variation="primary" isLoading={isSubmitting}>Submit Request</Button>
            </Flex>
          </Flex>
        </form>
      </View>
    </View>
  );
}