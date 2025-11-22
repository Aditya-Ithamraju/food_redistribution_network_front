# Food Waste Redistribution Network

A modern web application designed to connect food donors with those in need, reducing food waste while feeding communities. This platform enables users to donate surplus food and request available food items in real-time through an intuitive map and list-based interface.

## Features

- **Interactive Map View**: Visualize surplus food and requests on a dynamic map powered by Leaflet
- **List View**: Browse food items in a comprehensive list format with filtering and sorting options
- **Donation Portal**: Easy-to-use modal interface for donors to list surplus food
- **Request System**: Users can submit food requests with specific categories and quantity needs
- **User Profiles**: Secure authentication and user management with AWS Amplify
- **Donation Points System**: Earn points by contributing food to the community
- **Real-time Updates**: Live data synchronization across all views
- **My Donations**: Track all food donations made by users
- **My Requests**: Monitor pending and fulfilled food requests
- **Responsive Design**: Beautiful, fully responsive UI built with Tailwind CSS

## Technology Stack

### Frontend
- **React 19**: Modern UI library with hooks and concurrent features
- **TypeScript**: Type-safe development experience
- **Vite**: Lightning-fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **AWS Amplify UI**: Pre-built, accessible components for authentication and UI
- **React Leaflet**: Interactive mapping solution
- **Sonner**: Elegant toast notifications
- **ESLint & Prettier**: Code quality and formatting

### Backend & Infrastructure
- **AWS Amplify**: Handles authentication, API management, and deployment
- **AWS Lambda Functions**: Serverless compute for API endpoints
- **Amazon API Gateway**: RESTful API management
- **Amazon Cognito**: User authentication and authorization
- **Amazon DynamoDB**: NoSQL database for scalable data storage
- **AWS S3**: File storage for images and documents
- **AWS CloudWatch**: Logging and monitoring

## Architecture

### Frontend Architecture
```
src/
├── components/
│   ├── Dashboard.tsx          # Main dashboard container
│   ├── MapView.tsx            # Interactive map display
│   ├── ListView.tsx           # List-based food items view
│   ├── DonateFoodModal.tsx    # Donation form modal
│   ├── RequestFoodModal.tsx   # Request form modal
│   ├── MyDonationsView.tsx    # User's donations tracker
│   ├── MyRequestsView.tsx     # User's requests tracker
│   ├── SurplusCard.tsx        # Individual food item card
│   └── UserSetup.tsx          # User profile setup
├── lib/
│   └── utils.ts               # Utility functions
├── App.tsx                    # Main application component
├── main.tsx                   # React entry point
└── index.css                  # Global styles
```

### Backend Architecture (AWS)

The application uses AWS serverless architecture for maximum scalability and reliability:

#### API Endpoints (AWS Lambda + API Gateway)
- `GET /surpluses` - Retrieve all available surplus food items
- `GET /surpluses/me` - Get current user's donations
- `POST /surpluses` - Create a new food donation
- `GET /food-requests` - Retrieve all pending requests
- `GET /food-requests/me` - Get current user's requests
- `POST /food-requests` - Create a new food request
- `PUT /surpluses/{id}` - Update donation status
- `PUT /food-requests/{id}` - Update request status

#### AWS Services Used

**Authentication & Authorization**
- **AWS Cognito**: User pools for authentication, JWT token generation
- Secure session management with ID tokens

**Data Storage**
- **DynamoDB Tables**:
  - `Surpluses`: Food donation listings
  - `FoodRequests`: Food request listings
  - `Users`: User profiles and metadata

**Compute**
- **AWS Lambda**: Event-driven, serverless functions handling API requests
  - Auto-scaling: Automatically scales based on demand
  - No server management required

**API Management**
- **API Gateway**: Manages HTTP requests, authentication, rate limiting, and CORS

**File Storage**
- **Amazon S3**: Stores food item images and user documents

**Monitoring & Logging**
- **CloudWatch**: Application logs, error tracking, and performance metrics

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- AWS Account with Amplify configured
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aditya-Ithamraju/food_waste_redistribution_network_frontend.git
   cd food_waste_redistribution_network_frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure AWS Amplify**
   - Ensure your `src/aws-exports.js` file is properly configured
   - Update `.env.local` with your Amplify configuration:
     ```bash
     VITE_CONVEX_URL=your_convex_url
     CONVEX_DEPLOYMENT=your_deployment
     ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

This generates optimized static files in the `dist/` directory.

## Project Structure

```
food_waste_redistribution_network_frontend/
├── src/
│   ├── components/          # React components
│   ├── lib/                 # Utility functions
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS config
├── tsconfig.json            # TypeScript configuration
├── eslint.config.js         # ESLint configuration
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## Security & Authentication

- **JWT Tokens**: Secure token-based authentication via AWS Cognito
- **CORS Protection**: API Gateway handles cross-origin requests
- **Authorization Headers**: All API requests include Authorization token
- **Input Validation**: Server-side validation on all API endpoints
- **Secure Storage**: Environment variables stored securely, never committed to Git

## API Integration

The frontend communicates with AWS Lambda functions through API Gateway:

```typescript
// Example API call with authentication
const session = await fetchAuthSession();
const { idToken } = session.tokens ?? {};
const authHeaders = { headers: { Authorization: idToken.toString() } };

const response = await get({
  apiName: 'FoodWasteAPI',
  path: '/surpluses',
  options: authHeaders
}).response;
```

## UI/UX Features

- **Responsive Design**: Mobile-first approach, works on all devices
- **Accessibility**: ARIA labels, semantic HTML, keyboard navigation
- **Dark Mode Support**: Tailwind CSS dark mode compatibility
- **Loading States**: Smooth loading indicators and transitions
- **Error Handling**: User-friendly error messages with actionable hints
- **Toast Notifications**: Real-time feedback with Sonner

## Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting and type checking
npm run lint

# Format code with Prettier
npm run format
```

## Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## Environmental Variables

Create a `.env.local` file in the root directory:

```bash
VITE_CONVEX_URL=your_convex_deployment_url
CONVEX_DEPLOYMENT=your_deployment_name
```

These variables are used for backend connectivity and should never be committed to version control.

## Debugging

### Enable Console Logging
Open browser DevTools (F12) and check the Console tab for detailed logs from:
- API requests and responses
- Authentication events
- Component lifecycle events
- Navigation events

### Debug Auth Session
Use the built-in debug button in error states to print authentication session information to the console.

### Network Inspection
Use the Network tab in DevTools to inspect API calls and responses from AWS Lambda functions.

## Common Issues & Solutions

### CORS Errors
- **Issue**: "Access to XMLHttpRequest blocked by CORS policy"
- **Solution**: Ensure `Access-Control-Allow-Origin` and `Access-Control-Allow-Headers` are configured in API Gateway

### 401/403 Authentication Errors
- **Issue**: Unauthorized access to API endpoints
- **Solution**: Verify Amplify auth session is valid and tokens are properly configured

### API Connection Failures
- **Issue**: Cannot connect to Lambda functions
- **Solution**: Check AWS API Gateway configuration and Lambda function deployment status

## Deployment

### Deploy to AWS Amplify

```bash
# Install Amplify CLI (if not already installed)
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Deploy
amplify publish
```

### Manual Build & Deploy

```bash
# Build the project
npm run build

# Deploy dist/ folder to your hosting service
# (AWS S3 + CloudFront, Vercel, Netlify, etc.)
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Add comments for complex logic

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.

## Author

**Aditya Ithamraju**
- GitHub: [@Aditya-Ithamraju](https://github.com/Aditya-Ithamraju)

## Support

For issues, questions, or suggestions, please:
1. Check existing GitHub Issues
2. Open a new Issue with detailed description
3. Submit a Pull Request with fixes

## Acknowledgments

- AWS Amplify for seamless authentication and API management
- React community for excellent tools and libraries
- Tailwind CSS for utility-first styling
- Leaflet for interactive mapping capabilities

## Additional Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Leaflet Documentation](https://leafletjs.com/)

---

**Last Updated**: November 2025
