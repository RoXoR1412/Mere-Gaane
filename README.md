# मेरे गाने (Mere Gaane) - A Spotify-like Music Player using YouTube API

मेरे गाने (Mere Gaane, meaning "My Songs" in Hindi) is a Spotify-like music streaming web application that uses the YouTube API to provide free music streaming. This project is built with React, TypeScript, and Material-UI.

## Features

- 🎵 Stream music for free using YouTube as the source
- 🔍 Search for songs, albums, artists, and playlists
- 📚 Organize your music library
- 📱 Responsive design that works on desktop and mobile
- 🎨 Beautiful dark theme UI inspired by Spotify
- 🇮🇳 Focus on Indian music (Bollywood, Punjabi, etc.)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- YouTube Data API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/mere-gaane.git
   cd mere-gaane
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Add your YouTube API key:
   - Get a YouTube Data API key from the [Google Developer Console](https://console.developers.google.com/)
   - Open `src/api/youtubeApi.ts` and replace `'YOUR_YOUTUBE_API_KEY'` with your actual API key

4. Start the development server:
   ```
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

## Usage

- **Home**: Discover new music, recently played tracks, and personalized recommendations
- **Search**: Find songs, artists, albums, and playlists
- **Library**: Access your saved music and playlists
- **Player**: Control playback, adjust volume, and see what's currently playing

## Technical Details

- **Frontend**: React with TypeScript
- **UI Framework**: Material-UI
- **State Management**: React Context API
- **API**: YouTube Data API v3
- **Routing**: React Router
- **HTTP Client**: Axios

## Important Notes

- This application is for educational purposes only
- The YouTube API has quota limits, so be mindful of your usage
- This is not a commercial product and should not be used as such

## Future Enhancements

- User authentication
- Playlist creation and management
- Offline playback
- Music recommendations based on listening history
- Mobile app using React Native

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by Spotify's UI/UX
- Powered by YouTube's vast music collection
- Built with love for Indian music fans
