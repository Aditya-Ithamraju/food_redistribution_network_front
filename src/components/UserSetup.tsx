// In src/components/UserSetup.tsx

import { useState } from 'react';
import { Button, Flex, Heading, TextField, View } from '@aws-amplify/ui-react';
import { post } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { toast } from 'sonner';
import type { FormEvent } from 'react';

// The component now accepts a prop to call when it's done
export function UserSetup({ onProfileComplete }: { onProfileComplete: () => void }) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleSaveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name.');
      return;
    }
    
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number.');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      toast.error('Please enter a valid phone number.');
      return;
    }

    setIsLoading(true);
    try {
      const { idToken } = (await fetchAuthSession()).tokens ?? {};
      if (!idToken) { 
        throw new Error("No ID token found."); 
      }

      await post({
        apiName: 'FoodWasteAPI',
        path: '/users',
        options: {
          headers: { Authorization: idToken.toString() },
          body: { 
            name: name.trim(),
            phoneNumber: phoneNumber.trim()
          }
        }
      }).response;
      
      console.log('Profile updated successfully!');
      toast.success('Profile saved successfully!');
      
      // Instead of reloading, we call the function passed from the parent
      onProfileComplete();

    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View padding="medium" width="400px" margin="auto" style={{ border: '1px solid #ddd', borderRadius: '8px', marginTop: '2rem' }}>
      <form onSubmit={handleSaveProfile}>
        <Flex direction="column" gap="medium">
          <Heading level={3}>Welcome! Please complete your profile.</Heading>
          <TextField
            label="Full Name"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            isRequired
          />
          <TextField
            label="Phone Number"
            type="tel"
            placeholder="Enter your phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            isRequired
          />
          <Button 
            type="submit" 
            variation="primary"
            isLoading={isLoading}
            loadingText="Saving..."
          >
            Save Profile
          </Button>
        </Flex>
      </form>
    </View>
  );
}