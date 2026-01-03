import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Music,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  Radio,
  Coffee,
  CloudRain,
  Waves,
  Wind,
  TreePine,
  Flame,
  Moon,
} from "lucide-react";
import { toast } from "sonner";

interface Track {
  id: string;
  name: string;
  nameHe: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "lofi" | "nature" | "ambient";
}

// Free royalty-free ambient sounds (placeholders - replace with actual URLs)
const TRACKS: Track[] = [
  {
    id: "lofi-1",
    name: "Lo-Fi Beats",
    nameHe: "לופי צ'יל",
    url: "https://cdn.pixabay.com/audio/2024/02/15/audio_69a4f2d698.mp3",
    icon: Coffee,
    category: "lofi",
  },
  {
    id: "rain",
    name: "Rain Sounds",
    nameHe: "צלילי גשם",
    url: "https://cdn.pixabay.com/audio/2022/03/12/audio_b4f5c0e41a.mp3",
    icon: CloudRain,
    category: "nature",
  },
  {
    id: "ocean",
    name: "Ocean Waves",
    nameHe: "גלי ים",
    url: "https://cdn.pixabay.com/audio/2021/08/09/audio_ab7ab4a422.mp3",
    icon: Waves,
    category: "nature",
  },
  {
    id: "wind",
    name: "Gentle Wind",
    nameHe: "רוח עדינה",
    url: "https://cdn.pixabay.com/audio/2022/07/26/audio_6fa7b43c66.mp3",
    icon: Wind,
    category: "nature",
  },
  {
    id: "forest",
    name: "Forest Ambience",
    nameHe: "אווירת יער",
    url: "https://cdn.pixabay.com/audio/2021/08/08/audio_e0f0a68848.mp3",
    icon: TreePine,
    category: "nature",
  },
  {
    id: "fireplace",
    name: "Fireplace",
    nameHe: "אח בוער",
    url: "https://cdn.pixabay.com/audio/2022/03/09/audio_c02c0daf61.mp3",
    icon: Flame,
    category: "ambient",
  },
  {
    id: "night",
    name: "Night Sounds",
    nameHe: "צלילי לילה",
    url: "https://cdn.pixabay.com/audio/2022/01/20/audio_4377a14c23.mp3",
    icon: Moon,
    category: "ambient",
  },
];

interface BackgroundMusicSettings {
  enabled: boolean;
  volume: number;
  currentTrackId: string | null;
  autoPlayOnFocus: boolean;
  fadeIn: boolean;
}

const defaultSettings: BackgroundMusicSettings = {
  enabled: false,
  volume: 50,
  currentTrackId: null,
  autoPlayOnFocus: false,
  fadeIn: true,
};

export const BackgroundMusic = () => {
  const [settings, setSettings] = useState<BackgroundMusicSettings>(() => {
    const saved = localStorage.getItem("background-music-settings");
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = TRACKS.find((t) => t.id === settings.currentTrackId);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    audioRef.current.volume = settings.volume / 100;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Save settings
  useEffect(() => {
    localStorage.setItem("background-music-settings", JSON.stringify(settings));
  }, [settings]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = settings.volume / 100;
    }
  }, [settings.volume]);

  const playTrack = async (track: Track) => {
    if (!audioRef.current) return;

    setIsLoading(true);

    try {
      // Stop current track
      audioRef.current.pause();
      audioRef.current.src = track.url;

      // Fade in effect
      if (settings.fadeIn) {
        audioRef.current.volume = 0;
        await audioRef.current.play();
        
        // Gradually increase volume
        let vol = 0;
        const targetVol = settings.volume / 100;
        const interval = setInterval(() => {
          vol += 0.05;
          if (audioRef.current) {
            audioRef.current.volume = Math.min(vol, targetVol);
          }
          if (vol >= targetVol) {
            clearInterval(interval);
          }
        }, 50);
      } else {
        audioRef.current.volume = settings.volume / 100;
        await audioRef.current.play();
      }

      setSettings((prev) => ({ ...prev, currentTrackId: track.id, enabled: true }));
      setIsPlaying(true);
      toast.success(`מנגן: ${track.nameHe}`);
    } catch (error) {
      console.error("Error playing track:", error);
      toast.error("שגיאה בהפעלת המוזיקה");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentTrack) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const skipToNext = () => {
    const currentIndex = TRACKS.findIndex((t) => t.id === settings.currentTrackId);
    const nextIndex = (currentIndex + 1) % TRACKS.length;
    playTrack(TRACKS[nextIndex]);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (settings.volume > 0) {
      setSettings((prev) => ({ ...prev, volume: 0 }));
    } else {
      setSettings((prev) => ({ ...prev, volume: 50 }));
    }
  };

  const groupedTracks = {
    lofi: TRACKS.filter((t) => t.category === "lofi"),
    nature: TRACKS.filter((t) => t.category === "nature"),
    ambient: TRACKS.filter((t) => t.category === "ambient"),
  };

  return (
    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-none shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Music className="w-5 h-5 text-purple-500" />
          מוזיקת רקע
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Now Playing */}
        {currentTrack && (
          <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  {currentTrack.icon && <currentTrack.icon className="w-5 h-5 text-purple-500" />}
                </div>
                <div>
                  <p className="font-medium text-sm">{currentTrack.nameHe}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{currentTrack.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isPlaying && (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-1 bg-purple-500 rounded-full animate-pulse"
                        style={{
                          height: `${8 + Math.random() * 8}px`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="hover:bg-purple-100 dark:hover:bg-purple-900/30"
              >
                {settings.volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>

              <Button
                variant="default"
                size="icon"
                onClick={togglePlayPause}
                disabled={isLoading}
                className="w-12 h-12 rounded-full bg-purple-500 hover:bg-purple-600"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 mr-[-2px]" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={skipToNext}
                className="hover:bg-purple-100 dark:hover:bg-purple-900/30"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            {/* Volume Slider */}
            <div className="flex items-center gap-3 mt-3">
              <VolumeX className="w-4 h-4 text-gray-400" />
              <Slider
                value={[settings.volume]}
                onValueChange={([value]) => setSettings((prev) => ({ ...prev, volume: value }))}
                max={100}
                step={1}
                className="flex-1"
              />
              <Volume2 className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        )}

        {/* Track Categories */}
        <div className="space-y-4">
          {/* Lo-Fi */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Radio className="w-4 h-4 text-purple-500" />
              לופי / צ'יל
            </h3>
            <div className="flex flex-wrap gap-2">
              {groupedTracks.lofi.map((track) => (
                <Button
                  key={track.id}
                  variant={settings.currentTrackId === track.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => playTrack(track)}
                  className={`flex items-center gap-2 ${
                    settings.currentTrackId === track.id
                      ? "bg-purple-500 text-white"
                      : ""
                  }`}
                >
                  {track.icon && <track.icon className="w-4 h-4" />}
                  {track.nameHe}
                </Button>
              ))}
            </div>
          </div>

          {/* Nature */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <TreePine className="w-4 h-4 text-green-500" />
              צלילי טבע
            </h3>
            <div className="flex flex-wrap gap-2">
              {groupedTracks.nature.map((track) => (
                <Button
                  key={track.id}
                  variant={settings.currentTrackId === track.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => playTrack(track)}
                  className={`flex items-center gap-2 ${
                    settings.currentTrackId === track.id
                      ? "bg-green-500 text-white"
                      : ""
                  }`}
                >
                  {track.icon && <track.icon className="w-4 h-4" />}
                  {track.nameHe}
                </Button>
              ))}
            </div>
          </div>

          {/* Ambient */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-500" />
              אווירה
            </h3>
            <div className="flex flex-wrap gap-2">
              {groupedTracks.ambient.map((track) => (
                <Button
                  key={track.id}
                  variant={settings.currentTrackId === track.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => playTrack(track)}
                  className={`flex items-center gap-2 ${
                    settings.currentTrackId === track.id
                      ? "bg-indigo-500 text-white"
                      : ""
                  }`}
                >
                  {track.icon && <track.icon className="w-4 h-4" />}
                  {track.nameHe}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="fade-in" className="text-sm">
              אפקט fade-in בהפעלה
            </Label>
            <Switch
              id="fade-in"
              checked={settings.fadeIn}
              onCheckedChange={(fadeIn) => setSettings((prev) => ({ ...prev, fadeIn }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-focus" className="text-sm">
              הפעל אוטומטית במצב פוקוס
            </Label>
            <Switch
              id="auto-focus"
              checked={settings.autoPlayOnFocus}
              onCheckedChange={(autoPlayOnFocus) =>
                setSettings((prev) => ({ ...prev, autoPlayOnFocus }))
              }
            />
          </div>
        </div>

        {/* Quick Tip */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2">
          💡 מוזיקת רקע עוזרת להתמקד ולהגביר פרודוקטיביות
        </div>
      </CardContent>
    </Card>
  );
};

export default BackgroundMusic;
