// In src/components/DonateFoodModal.tsx
import { useState, useRef, useEffect } from 'react';
import { post } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Geo } from '@aws-amplify/geo';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import { Button, Flex, Heading, TextField, View, SelectField, Alert, Text } from '@aws-amplify/ui-react';
import type { FormEvent } from 'react';

// ... (Icon Fix and Helper components are the same as before)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;
type Position = { lat: number; lng: number };
type PresignedUrlResponse = { uploadURL: string; key: string; };
function MapResizeFix() { const map = useMap(); useEffect(() => { const timer = setTimeout(() => map.invalidateSize(), 100); return () => clearTimeout(timer); }, [map]); return null; }
function ChangeMapView({ center }: { center: [number, number] }) { const map = useMap(); useEffect(() => { map.flyTo(center, 15) }, [center, map]); return null; }
type LocationMarkerProps = { position: Position | null; setPosition: (pos: LatLng | null) => void; setAddress: (addr: string) => void; };
function LocationMarker({ position, setPosition, setAddress }: LocationMarkerProps) { const map = useMapEvents({ click(e) { setPosition(e.latlng); map.flyTo(e.latlng, map.getZoom()); Geo.searchByCoordinates([e.latlng.lng, e.latlng.lat]).then((result) => { if (result?.label) { setAddress(result.label); } }); } }); return position === null ? null : <Marker position={position} eventHandlers={{ click: () => { setPosition(null); setAddress(''); }, }}></Marker>; }

type DonateFoodModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onDonationSuccess: () => void;
};

export function DonateFoodModal({ isOpen, onClose, onDonationSuccess }: DonateFoodModalProps) {
  const [formData, setFormData] = useState({ foodType: '', quantity: '', expirationDate: '', address: '' });
  const [position, setPosition] = useState<Position | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- THIS FUNCTION IS NOW FULLY RESTORED ---
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault(); // This is the line that was missing, it stops the page refresh
    if (!selectedFile) { setMessage('Please select an image to upload.'); setStatus('error'); return; }
    if (!position) { setMessage('Please select a location on the map.'); setStatus('error'); return; }
    
    setStatus('submitting');
    setMessage('');

    try {
      const { idToken } = (await fetchAuthSession()).tokens ?? {};
      if (!idToken) throw new Error("User not authenticated");
      
      const presignedUrlResponse = await post({
        apiName: 'FoodWasteAPI', path: '/uploads',
        options: { headers: { Authorization: idToken.toString() }, body: { contentType: selectedFile.type } }
      }).response;
      const { uploadURL, key } = await presignedUrlResponse.body.json() as PresignedUrlResponse;

      await fetch(uploadURL, { method: 'PUT', body: selectedFile, headers: { 'Content-Type': selectedFile.type } });

      const surplusData = {
        ...formData,
        quantity: parseInt(formData.quantity, 10),
        imageKey: key,
        coordinates: position
      };

      await post({
        apiName: 'FoodWasteAPI', path: '/surpluses',
        options: { headers: { Authorization: idToken.toString() }, body: surplusData }
      }).response;
      
      setStatus('success');
      setMessage('Donation submitted successfully! Thank you.');
      onDonationSuccess();
      setTimeout(() => { onClose(); setStatus('idle'); }, 2000);
    } catch (err) {
      console.error('Donation submission failed:', err);
      setStatus('error');
      setMessage('Submission failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <View style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={onClose}>
      <View 
        backgroundColor="white" 
        padding="large" 
        borderRadius="medium" 
        width={{ base: '90%', large: '600px' }}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="medium">
            <Heading level={3}>Donate Surplus Food</Heading>
            
            <Text fontSize="small">Click on the map to drop a pin for the pickup location. Click the pin again to remove it.</Text>
            <View height="300px" width="100%" borderRadius="medium" style={{overflow: 'hidden', border: '1px solid #ccc'}}>
                <MapContainer center={[12.9716, 77.5946]} zoom={11} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker 
                    position={position} 
                    setPosition={(pos) => setPosition(pos ? { lat: pos.lat, lng: pos.lng } : null)}
                    setAddress={(addr) => setFormData(p => ({...p, address: addr}))} 
                  />
                  {position && <ChangeMapView center={[position.lat, position.lng]} />}
                  <MapResizeFix />
                </MapContainer>
            </View>
            
            <TextField 
              label="Pickup Address (auto-filled by map)" 
              name="address" 
              value={formData.address}
              isRequired
              readOnly={true}
              placeholder="Address will appear here after you pin a location"
            />
            <SelectField label="Food Type" name="foodType" value={formData.foodType} onChange={(e) => setFormData(p => ({...p, foodType: e.target.value}))} required>
              <option value="">Select a food type</option><option value="Fruits">Fruits</option><option value="Vegetables">Vegetables</option><option value="Baked Goods">Baked Goods</option><option value="Canned Goods">Canned Goods</option><option value="Other">Other</option>
            </SelectField>
            <TextField label="Quantity" name="quantity" type="number" value={formData.quantity} onChange={(e) => setFormData(p => ({...p, quantity: e.target.value}))} isRequired />
            <TextField label="Expiration Date" name="expirationDate" type="date" value={formData.expirationDate} onChange={(e) => setFormData(p => ({...p, expirationDate: e.target.value}))} isRequired />
            
            <View><Text as="label" htmlFor="file-upload" fontWeight="bold">Food Image</Text><input id="file-upload" type="file" accept="image/png, image/jpeg" ref={fileInputRef} onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} required /></View>
            
            <Flex direction="row" gap="small" justifyContent="flex-end">
              <Button type="button" onClick={onClose} disabled={status === 'submitting'}>Cancel</Button>
              <Button type="submit" variation="primary" isLoading={status === 'submitting'}>Submit Donation</Button>
            </Flex>
            
            {status === 'success' && <Alert variation="success">{message}</Alert>}
            {status === 'error' && <Alert variation="error">{message}</Alert>}
          </Flex>
        </form>
      </View>
    </View>
  );
}