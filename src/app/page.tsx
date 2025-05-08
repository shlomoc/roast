"use client";
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PlayIcon } from "lucide-react";

// Keep this in sync with MODEL_MAP in /api/roast/route.ts
const MODELS = [
  { label: "GPT-4.1", value: "gpt-4.1" },
  { label: "Gemini", value: "gemini" },
  { label: "Grok", value: "grok" },
];

// Spinner component
function Spinner() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-20"
      aria-label="Loading audio"
      role="status"
    >
      <div className="w-12 h-12 border-4 border-purple-400 border-t-pink-400 rounded-full animate-spin bg-white/80 shadow-lg" />
    </div>
  );
}

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [model, setModel] = useState(MODELS[0].value);
  const [intensity, setIntensity] = useState(5);
  const [roast, setRoast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlayPending, setIsPlayPending] = useState(false);

  // Camera logic
  const startCamera = async () => {
    setError(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setError("Unable to access camera.");
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 320, 240);
        const dataUrl = canvasRef.current.toDataURL("image/png");
        setImage(dataUrl);
        // Stop camera
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        setCameraActive(false);
      }
    }
  };

  // File upload logic
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string); // This will be a data URL
        setCameraActive(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add this cleanup function
  const cleanupAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setIsPlaying(false);
    setIsPaused(false);
    setIsPlayPending(false);
  };

  // Roast logic (calls API)
  const handleRoast = async () => {
    // Clean up any existing audio
    cleanupAudio();
    
    setLoading(true);
    setRoast(null);
    setError(null);
    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          model,
          intensity,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to get roast.");
      } else {
        setRoast(data.roast);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Text-to-speech logic
  const handleTextToSpeech = async () => {
    if (!roast) return;
    
    // Clean up any existing audio
    cleanupAudio();
    
    try {
      setIsPlayPending(true);
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: roast }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      // Use a single Audio object for playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = url;
        audioRef.current.currentTime = 0;
      } else {
        audioRef.current = new window.Audio(url);
      }
      audioRef.current.onended = () => {
        cleanupAudio();
      };
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsPaused(false);
        })
        .catch(() => {
          setError("Failed to play audio");
          cleanupAudio();
        })
        .finally(() => {
          setIsPlayPending(false);
        });
    } catch (error) {
      console.error("Error playing audio:", error);
      setError("Failed to play audio");
      cleanupAudio();
    }
  };

  const handlePlay = () => {
    if (audioUrl && audioRef.current) {
      setIsPlayPending(true); // Disable Play button immediately
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsPaused(false);
        })
        .catch(() => {
          setError("Failed to play audio");
        })
        .finally(() => {
          setIsPlayPending(false);
        });
    }
  };

  const handlePauseResume = () => {
    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.play();
        setIsPaused(false);
      } else {
        audioRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const handleStop = () => {
    cleanupAudio();
  };

  // UI
  return (
    <div className="min-h-screen bg-beige flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#f5f5dc' }}>
      {/* Main Card */}
      <Card className="max-w-xl w-full bg-white/90 border-purple-200 shadow-2xl">
        <CardContent className="p-6 flex flex-col gap-6 items-center">
          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent mb-2">AI Roast Machine</h1>
          <p className="text-center text-gray-600 mb-2">Upload or snap a pic, pick your model, and get roasted by AI!</p>

          {/* Image Upload & Camera */}
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center">
            <div className="flex flex-col gap-2 items-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
              />
              <Button variant="outline" onClick={startCamera} disabled={cameraActive} className="w-full">Use Camera</Button>
            </div>
            {cameraActive && (
              <div className="flex flex-col items-center gap-2">
                <video ref={videoRef} width={320} height={240} className="rounded-lg border border-purple-200" />
                <Button onClick={capturePhoto} className="w-full">Capture</Button>
                <canvas ref={canvasRef} width={320} height={240} className="hidden" />
              </div>
            )}
            {image && !cameraActive && (
              <div className="flex flex-col items-center gap-2">
                <img src={image} alt="Preview" className="rounded-lg border border-blue-200 w-40 h-40 object-cover" />
                <Button variant="ghost" onClick={() => { setImage(null); }}>Remove</Button>
              </div>
            )}
          </div>

          {/* Model Selection & Intensity */}
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center">
            <div className="w-full sm:w-1/2">
              <label className="block text-sm font-medium mb-1">Model</label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block text-sm font-medium mb-1">Roast Intensity</label>
              <div className="flex items-center gap-2">
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[intensity]}
                  onValueChange={([v]) => setIntensity(v)}
                  className="w-full"
                />
                <span className="text-xs font-bold text-purple-600">{intensity}</span>
              </div>
            </div>
          </div>

          {/* Roast Button */}
          <Button
            className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white text-lg font-bold py-2 mt-2 hover:scale-105 transition-transform"
            onClick={handleRoast}
            disabled={!image || loading}
          >
            {loading ? "Roasting..." : "Roast Me!"}
          </Button>

          {/* Error */}
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          {/* Roast Result */}
          {roast && (
            <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 border border-purple-200 text-center text-lg font-semibold text-gray-800 shadow relative">
              <div className="flex flex-col items-center gap-2">
                <p>{roast}</p>
                {/* Spinner overlay during audio loading/buffering */}
                <div className="relative w-full flex justify-center items-center min-h-[48px]">
                  {isPlayPending && (
                    <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 opacity-100 pointer-events-none">
                      <Spinner />
                    </div>
                  )}
                  {/* Playback Controls */}
                  {audioUrl && (
                    <div className={`flex gap-2 mt-2 transition-opacity duration-300 ${isPlayPending ? 'opacity-40' : 'opacity-100'}`}>
                      <Button
                        onClick={handlePlay}
                        disabled={isPlayPending || (isPlaying && !isPaused)}
                        className={`bg-purple-500 hover:bg-purple-600 text-white ${(isPlayPending || (isPlaying && !isPaused)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Play
                      </Button>
                      <Button
                        onClick={handlePauseResume}
                        disabled={!isPlaying}
                        className={`bg-blue-500 hover:bg-blue-600 text-white ${!isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isPaused ? 'Resume' : 'Pause'}
                      </Button>
                      <Button
                        onClick={handleStop}
                        disabled={!isPlaying && !isPaused}
                        className={`bg-pink-500 hover:bg-pink-600 text-white ${(!isPlaying && !isPaused) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Stop
                      </Button>
                    </div>
                  )}
                  {/* Old Play button for TTS generation */}
                  {!audioUrl && (
                    <Button
                      onClick={handleTextToSpeech}
                      disabled={isPlayPending || isPlaying}
                      className="mt-2 bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      <PlayIcon className="w-4 h-4 mr-2" />
                      {isPlaying ? "Playing..." : "Play Roast"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Disclaimer moved to footer */}
      <Card className="max-w-xl w-full mt-6 bg-white/80 border-pink-200 shadow-lg">
        <CardContent className="p-4 text-center text-sm text-gray-700">
          <b>Disclaimer:</b> This app is for fun only! No images are stored. Roasts are generated by AI and meant to be lighthearted. Please don&apos;t take them seriously.
        </CardContent>
      </Card>
      <footer className="mt-8 text-xs text-gray-400 text-center">Made with ❤️ and a sense of humor.</footer>
    </div>
  );
}
