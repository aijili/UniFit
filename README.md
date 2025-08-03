# UniFit - Clothing Rental Platform for College Students

**Borrow Better. Dress Smarter.**

UniFit is a peer-to-peer marketplace designed specifically for college students to borrow and lend clothes. Built with React Native and Expo, it addresses the common challenge of having endless events but limited outfits, while promoting sustainable fashion practices.

## 🎯 Mission

**"Endless events, limited outfits."**

College life is filled with events, parties, interviews, and special occasions, but buying new clothes for every occasion is expensive and unsustainable. Most items are worn once and then sit unused, taking up space. While borrowing from friends is great, it's not always reliable. Sometimes even if you order clothes, they don't arrive before the event.

UniFit solves these problems by connecting college students in a trusted community where they can:
- **Always look and feel your best** — no matter the occasion
- **Save money or earn income** through your closet
- **Share over hoarding** — dress well, live light

## 🚀 Features

### Core Functionality
- **Clothing Discovery**: Browse available clothing items by category, color, and size
- **Item Posting**: Upload and list clothing items for rent with detailed descriptions
- **Borrowing System**: Request to borrow items with customizable rental periods
- **Activity Management**: Track pending requests and manage borrow/return status
- **User Profiles**: Personalized profiles with avatar and user information

### Categories & Filtering
- **Clothing Categories**: Formal, Casual, Going Out, Athleisure, Loungewear, Outerwear, Vacation, Workwear, Costume
- **Advanced Filtering**: Filter by category, color, size, and availability
- **Search Functionality**: Search through available items

### User Experience
- **Modern UI/UX**: Clean, intuitive interface with smooth animations
- **Image Upload**: Easy photo upload for item listings
- **Real-time Updates**: Live status updates for borrow requests
- **Responsive Design**: Optimized for both iOS and Android

## 🎓 Perfect for College Students

### Why UniFit?
- **Cost-Effective**: Save money by borrowing instead of buying for one-time events
- **Sustainable**: Reduce fashion waste by sharing clothes within your community
- **Convenient**: Access a variety of styles without the commitment of ownership
- **Reliable**: Built-in trust system and user verification for safe borrowing
- **Community**: Connect with fellow students and build lasting relationships

### Use Cases
- **Formal Events**: Homecoming, graduation, job interviews
- **Theme Parties**: Halloween, Greek life events, themed socials
- **Seasonal Occasions**: Holiday parties, spring break, summer events
- **Everyday Style**: Try new trends without the investment

## 🛠 Tech Stack

### Frontend
- **React Native** (0.76.9) - Cross-platform mobile development
- **Expo** (52.0.46) - Development platform and tools
- **Expo Router** (4.0.20) - File-based routing
- **TypeScript** - Type-safe development

### UI/UX Libraries
- **React Native Reanimated** - Smooth animations
- **Expo Linear Gradient** - Beautiful gradient effects
- **React Native Dropdown Picker** - Custom dropdown components
- **Expo Vector Icons** - Icon library
- **React Native Gesture Handler** - Touch interactions

### Backend & Services
- **Firebase Authentication** - User authentication and management
- **Firestore** - NoSQL cloud database
- **Firebase Storage** - Image and file storage
- **Firebase Hosting** - Web deployment

### Development Tools
- **Jest** - Testing framework
- **ESLint** - Code linting
- **TypeScript** - Static type checking

## 📱 Screenshots

The app includes the following main screens:
- **Home**: Browse and search clothing items
- **Post**: Create new clothing listings
- **Activity**: Manage borrow requests and transactions
- **Profile**: User profile and settings
- **Login/Onboarding**: Authentication and user setup

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd UniFit
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your actual API keys
   nano .env
   ```

4. **Firebase Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication, Firestore, and Storage
   - Update `firebaseConfig.js` with your Firebase configuration
   - Set up Firestore security rules in `firestore.rules`

5. **Environment Configuration**
   - Copy your Firebase configuration to `firebaseConfig.js`
   - Ensure all required Firebase services are enabled

6. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

7. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

## 🔐 Environment Variables

The project uses environment variables to securely store API keys and configuration. Here's how to set them up:

### Required Environment Variables
- `OPENAI_API_KEY` - Your OpenAI API key for AI features

### Optional Environment Variables
- `FIREBASE_API_KEY` - Firebase API key (can be moved from firebaseConfig.js)
- `FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `FIREBASE_APP_ID` - Firebase app ID
- `FIREBASE_MEASUREMENT_ID` - Firebase measurement ID
- `NODE_ENV` - Environment (development/production)

### Using Environment Variables in Code
```typescript
import { ENV_CONFIG, OPENAI_API_KEY_CONFIG } from './config/env';

// Access your API key
const apiKey = OPENAI_API_KEY_CONFIG;

// Validate environment on startup
ENV_CONFIG.validateApiKeys();
```

### Security Notes
- The `.env` file is automatically ignored by Git
- Never commit API keys to version control
- Use `.env.example` as a template for required variables

## 📁 Project Structure

```
UniFit/
├── app/                    # Main application screens
│   ├── (tabs)/            # Tab-based navigation screens
│   │   ├── home.tsx       # Home screen with item browsing
│   │   ├── post.tsx       # Item posting screen
│   │   ├── activity.tsx   # Activity management screen
│   │   ├── profile.tsx    # User profile screen
│   │   └── _layout.tsx    # Tab navigation layout
│   ├── login.tsx          # Authentication screen
│   ├── onboarding.tsx     # User onboarding flow
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
│   ├── ListingModal.tsx   # Item detail modal
│   └── edit-listing.tsx   # Edit listing component
├── contexts/              # React contexts
├── hooks/                 # Custom React hooks
├── config/                # Configuration files
├── assets/                # Static assets (images, fonts)
├── firebaseConfig.js      # Firebase configuration
├── firestore.rules        # Firestore security rules
├── firestore.indexes.json # Firestore indexes
└── package.json           # Dependencies and scripts
```

## 🔧 Configuration

### Firebase Setup
1. Create a new Firebase project
2. Enable the following services:
   - Authentication (Email/Password)
   - Firestore Database
   - Storage
3. Update the configuration in `firebaseConfig.js`

### Firestore Collections
The app uses the following Firestore collections:
- `users` - User profiles and information
- `posts` - Clothing item listings
- `borrowRequests` - Borrow request transactions

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 📦 Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

### Web
```bash
expo build:web
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- Powered by [Firebase](https://firebase.google.com/)
- Icons from [Expo Vector Icons](https://expo.github.io/vector-icons/)

## 📞 Support

For support and questions, please open an issue in the GitHub repository or contact the development team.

---

**UniFit** - Connecting communities through shared fashion experiences.
