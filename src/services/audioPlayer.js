import { Howl } from "howler";

class AudioPlayerService {
  constructor() {
    this.sound = null;
    this.isPlaying = false;
  }

  /**
   * Play audio from URL
   * @param {string} audioUrl - URL to the audio file
   * @param {Function} onEndCallback - Callback to run when audio finishes
   * @returns {Promise<void>}
   */
  playFromUrl(audioUrl, onEndCallback = () => {}) {
    // Clean up any existing audio
    this.stop();

    return new Promise((resolve, reject) => {
      try {
        // Create new Howl instance
        this.sound = new Howl({
          src: [audioUrl],
          format: ["ogg"],
          html5: true, // Use HTML5 Audio to handle streaming
          onplay: () => {
            this.isPlaying = true;
            resolve();
          },
          onend: () => {
            this.isPlaying = false;
            onEndCallback();
          },
          onloaderror: (id, error) => {
            console.error("Error loading audio:", error);
            this.isPlaying = false;
            reject(error);
          },
          onplayerror: (id, error) => {
            console.error("Error playing audio:", error);
            this.isPlaying = false;
            reject(error);
          },
        });

        // Play the sound
        this.sound.play();
      } catch (error) {
        console.error("Error creating audio player:", error);
        reject(error);
      }
    });
  }

  /**
   * Play or pause audio
   * @returns {boolean} - New playing state
   */
  togglePlay() {
    if (!this.sound) return false;

    if (this.isPlaying) {
      this.sound.pause();
      this.isPlaying = false;
    } else {
      this.sound.play();
      this.isPlaying = true;
    }

    return this.isPlaying;
  }

  /**
   * Stop audio playback
   */
  stop() {
    if (this.sound) {
      this.sound.stop();
      this.sound.unload();
      this.sound = null;
    }
    this.isPlaying = false;
  }

  /**
   * Seek forward by a specified number of seconds
   * @param {number} seconds - Number of seconds to seek forward
   * @returns {number} - New position in seconds
   */
  seekForward(seconds = 5) {
    if (!this.sound) return 0;

    const currentPos = this.sound.seek();
    const duration = this.sound.duration();
    const newPos = Math.min(currentPos + seconds, duration);

    this.sound.seek(newPos);
    return newPos;
  }

  /**
   * Seek backward by a specified number of seconds
   * @param {number} seconds - Number of seconds to seek backward
   * @returns {number} - New position in seconds
   */
  seekBackward(seconds = 5) {
    if (!this.sound) return 0;

    const currentPos = this.sound.seek();
    const newPos = Math.max(currentPos - seconds, 0);

    this.sound.seek(newPos);
    return newPos;
  }

  /**
   * Get current playing state
   * @returns {boolean}
   */
  getIsPlaying() {
    return this.isPlaying;
  }

  /**
   * Get current position in seconds
   * @returns {number} - Current position in seconds
   */
  getCurrentPosition() {
    if (!this.sound) return 0;
    return this.sound.seek();
  }

  /**
   * Get total duration in seconds
   * @returns {number} - Total duration in seconds
   */
  getDuration() {
    if (!this.sound) return 0;
    return this.sound.duration();
  }
}

// Create singleton instance
const audioPlayer = new AudioPlayerService();

export default audioPlayer;
