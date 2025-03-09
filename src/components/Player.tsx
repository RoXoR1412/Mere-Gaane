import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { formatTime } from '../utils/formatters';
import { 
  PlayArrow, 
  Pause, 
  SkipNext, 
  SkipPrevious, 
  VolumeUp, 
  VolumeOff, 
  Shuffle, 
  Block,
  Favorite,
  FavoriteBorder
} from '@mui/icons-material';
import './Player.css';

const Player: React.FC = () => {
  const { 
    currentSong, 
    isPlaying, 
    togglePlay, 
    volume, 
    setVolume, 
    currentTime, 
    duration, 
    seekTo, 
    nextSong, 
    prevSong, 
    queue,
    isShuffleMode,
    toggleShuffleMode,
    preventRepeat,
    togglePreventRepeat,
    playHistory,
    isLiked,
    toggleLikeSong
  } = usePlayer();
  
  const [seekValue, setSeekValue] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [localVolume, setLocalVolume] = useState(volume);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isDragging && currentTime > 0) {
      setSeekValue((currentTime / duration) * 100);
    }
  }, [currentTime, duration, isDragging]);
  
  useEffect(() => {
    setLocalVolume(volume);
  }, [volume]);
  
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && duration > 0) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const seekTimeValue = percent * duration;
      seekTo(seekTimeValue);
    }
  };
  
  const handleVolumeBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (volumeBarRef.current) {
      const rect = volumeBarRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newVolume = Math.max(0, Math.min(100, Math.round(percent * 100)));
      setLocalVolume(newVolume);
      setVolume(newVolume);
    }
  };
  
  const toggleMute = () => {
    if (localVolume === 0) {
      const previousVolume = localStorage.getItem('previousVolume');
      const newVolume = previousVolume ? parseInt(previousVolume, 10) : 70;
      setLocalVolume(newVolume);
      setVolume(newVolume);
    } else {
      localStorage.setItem('previousVolume', localVolume.toString());
      setLocalVolume(0);
      setVolume(0);
    }
  };
  
  if (!currentSong) return null;
  
  const capitalizeGenre = (genre?: string) => {
    if (!genre || genre === 'unknown') return '';
    return genre.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  return (
    <div className="player-container">
      {/* Left section - Song info */}
      <div className="player-section left">
        <div className="song-info">
          <img 
            src={currentSong.cover} 
            alt={currentSong.title}
            className="song-cover"
          />
          <div className="song-details">
            <div className="song-title">{currentSong.title}</div>
            <div className="song-artist">{currentSong.artist}</div>
            {currentSong.genre && currentSong.genre !== 'unknown' && (
              <div className="song-genre">{capitalizeGenre(currentSong.genre)}</div>
            )}
          </div>
          <div 
            className={`like-button ${isLiked(currentSong.id) ? 'active' : ''}`}
            onClick={() => toggleLikeSong(currentSong)}
          >
            {isLiked(currentSong.id) ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
          </div>
        </div>
      </div>
      
      {/* Center section - Controls and progress */}
      <div className="player-section center">
        <div className="control-buttons">
          <div 
            className={`control-button ${isShuffleMode ? 'active' : ''}`}
            onClick={toggleShuffleMode}
            title={isShuffleMode ? "Shuffle is ON" : "Shuffle is OFF"}
          >
            <Shuffle fontSize="small" />
          </div>
          
          <div 
            className="control-button"
            onClick={prevSong}
            title="Previous"
          >
            <SkipPrevious />
          </div>
          
          <div 
            className="play-button"
            onClick={togglePlay}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </div>
          
          <div 
            className="control-button"
            onClick={nextSong}
            title="Next"
            style={{ opacity: !queue.length && !isShuffleMode ? 0.5 : 1 }}
          >
            <SkipNext />
          </div>
          
          <div 
            className={`control-button ${preventRepeat ? 'active' : ''}`}
            onClick={togglePreventRepeat}
            title={preventRepeat ? "Prevent Repeat is ON" : "Prevent Repeat is OFF"}
          >
            <Block fontSize="small" />
          </div>
        </div>
        
        <div className="progress-container">
          <div className="progress-time">{formatTime(currentTime)}</div>
          <div 
            className="progress-bar"
            ref={progressBarRef}
            onClick={handleProgressBarClick}
          >
            <div 
              className="progress-fill"
              style={{ width: `${seekValue}%` }}
            >
              <div className="progress-handle"></div>
            </div>
          </div>
          <div className="progress-time right">{formatTime(duration)}</div>
        </div>
      </div>
      
      {/* Right section - Volume */}
      <div className="player-section right">
        <div className="volume-control">
          <div 
            className="volume-icon"
            onClick={toggleMute}
          >
            {localVolume === 0 ? <VolumeOff fontSize="small" /> : <VolumeUp fontSize="small" />}
          </div>
          <div 
            className="volume-bar"
            ref={volumeBarRef}
            onClick={handleVolumeBarClick}
          >
            <div 
              className="volume-fill"
              style={{ width: `${localVolume}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;