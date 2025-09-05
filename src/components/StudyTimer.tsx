import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    Timer,
    Play,
    Pause,
    SquareIcon,
    Settings
} from 'lucide-react';

export const StudyTimer: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [minutes, setMinutes] = useState(25);
    const [seconds, setSeconds] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Calculate progress percentage
    const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

    // Format time display
    const formatTime = (timeInSeconds: number) => {
        const mins = Math.floor(timeInSeconds / 60);
        const secs = timeInSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Start timer
    const startTimer = () => {
        if (totalTime === 0) {
            const newTotalTime = minutes * 60 + seconds;
            setTotalTime(newTotalTime);
            setTimeLeft(newTotalTime);
        }
        setIsRunning(true);
        setIsFinished(false);
        setIsOpen(false);
    };

    // Pause timer
    const pauseTimer = () => {
        setIsRunning(false);
    };

    // Stop timer
    const stopTimer = () => {
        setIsRunning(false);
        setTimeLeft(0);
        setTotalTime(0);
        setIsFinished(false);
    };

    // Reset timer
    const resetTimer = () => {
        setIsRunning(false);
        setIsFinished(false);
        const newTotalTime = minutes * 60 + seconds;
        setTotalTime(newTotalTime);
        setTimeLeft(newTotalTime);
    };

    // Timer effect
    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        setIsFinished(true);
                        // Play notification sound or show notification
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('Study Timer Finished!', {
                                body: 'Your study session is complete.',
                                icon: '/favicon.ico'
                            });
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, timeLeft]);

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Get timer button variant based on state
    const getTimerButtonVariant = () => {
        if (isFinished) return "default";
        if (isRunning) return "secondary";
        if (timeLeft > 0) return "outline";
        return "ghost";
    };

    // Get timer icon color based on state
    const getTimerIconColor = () => {
        if (isFinished) return "text-green-600";
        if (isRunning) return "text-blue-600";
        if (timeLeft > 0) return "text-orange-600";
        return "text-muted-foreground";
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant={getTimerButtonVariant()}
                        size="sm"
                        className="relative"
                    >
                        <Timer className={`h-4 w-4 ${getTimerIconColor()}`} />
                        {timeLeft > 0 && (
                            <span className="ml-1 text-xs font-mono">
                                {formatTime(timeLeft)}
                            </span>
                        )}
                        {/* Circular progress indicator */}
                        {totalTime > 0 && (
                            <div className="absolute -inset-1">
                                <svg
                                    className="w-full h-full transform -rotate-90"
                                    viewBox="0 0 36 36"
                                >
                                    <path
                                        className="text-muted-foreground/20"
                                        d="M18 2.0845
                                        a 15.9155 15.9155 0 0 1 0 31.831
                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    />
                                    <path
                                        className={isFinished ? "text-green-500" : isRunning ? "text-blue-500" : "text-orange-500"}
                                        strokeDasharray={`${progress}, 100`}
                                        d="M18 2.0845
                                        a 15.9155 15.9155 0 0 1 0 31.831
                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                        )}
                    </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                            <Timer className="h-5 w-5" />
                            <span>Study Timer</span>
                        </DialogTitle>
                        <DialogDescription>
                            Set your study session duration and track your progress
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Time Display */}
                        <div className="text-center">
                            <div className="relative inline-block">
                                {/* Circular Progress */}
                                <div className="w-32 h-32 relative">
                                    <svg
                                        className="w-full h-full transform -rotate-90"
                                        viewBox="0 0 100 100"
                                    >
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="45"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            className="text-muted-foreground/20"
                                        />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="45"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeLinecap="round"
                                            className={isFinished ? "text-green-500" : isRunning ? "text-blue-500" : "text-orange-500"}
                                            style={{
                                                strokeDasharray: `${2 * Math.PI * 45}`,
                                                strokeDashoffset: `${2 * Math.PI * 45 * (1 - progress / 100)}`,
                                                transition: 'stroke-dashoffset 1s ease-in-out'
                                            }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-2xl font-mono font-bold">
                                            {timeLeft > 0 ? formatTime(timeLeft) : formatTime(minutes * 60 + seconds)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Time Input */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="minutes">Minutes</Label>
                                <Input
                                    id="minutes"
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={minutes}
                                    onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                                    disabled={isRunning}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="seconds">Seconds</Label>
                                <Input
                                    id="seconds"
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={seconds}
                                    onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                    disabled={isRunning}
                                />
                            </div>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex justify-center space-x-2">
                            {!isRunning && timeLeft === 0 && (
                                <Button onClick={startTimer} disabled={minutes === 0 && seconds === 0}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Start
                                </Button>
                            )}
                            {!isRunning && timeLeft > 0 && (
                                <Button onClick={startTimer}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Resume
                                </Button>
                            )}
                            {isRunning && (
                                <Button onClick={pauseTimer} variant="secondary">
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause
                                </Button>
                            )}
                            {timeLeft > 0 && (
                                <Button onClick={stopTimer} variant="destructive">
                                    <SquareIcon className="h-4 w-4 mr-2" />
                                    Stop
                                </Button>
                            )}
                            {timeLeft !== totalTime && timeLeft !== 0 && (
                                <Button onClick={resetTimer} variant="outline">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Reset
                                </Button>
                            )}
                        </div>

                        {/* Status */}
                        {isFinished && (
                            <div className="text-center text-green-600 font-medium">
                                🎉 Study session completed!
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
