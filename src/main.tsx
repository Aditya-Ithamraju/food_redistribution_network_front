// In src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Additional CSS to fix map rendering issues in modals
const mapModalStyles = document.createElement('style');
mapModalStyles.textContent = `
  .leaflet-container {
    height: 100% !important;
    width: 100% !important;
    z-index: 1;
  }
  .leaflet-pane {
    z-index: auto;
  }
  .leaflet-control-container {
    z-index: 1000;
  }
`;
document.head.appendChild(mapModalStyles);

import { Amplify } from 'aws-amplify';

Amplify.configure({
  // Your existing Auth configuration is preserved
  Auth: {
    Cognito: {
      userPoolId: 'ap-south-1_TUF688yhv',
      userPoolClientId: '5tp2sfsc5koug7js86g3vbqa5p',
      identityPoolId: 'ap-south-1:7d095887-7cb1-4b83-a0b8-2d4b19491198'
    }
  },
  // Your existing API configuration is preserved
  API: {
    REST: {
      FoodWasteAPI: {
        endpoint: 'https://xyhl46bjp8.execute-api.ap-south-1.amazonaws.com',
        region: 'ap-south-1'
      }
    }
  },
  // Your existing Storage configuration is preserved
  Storage: {
    S3: {
      bucket: 'food-rescue-images',
      region: 'ap-south-1',
    }
  },
  // --- ADD THIS NEW GEO CATEGORY ---
  Geo: {
    LocationService: {
      region: 'ap-south-1', // Your AWS region
      searchIndices: {
        items: ['food-rescue-index'], // <-- REPLACE WITH YOUR ACTUAL PLACE INDEX NAME
        default: 'food-rescue-index'  // <-- REPLACE WITH YOUR ACTUAL PLACE INDEX NAME
      }
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);