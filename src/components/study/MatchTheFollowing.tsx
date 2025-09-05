import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RotateCcw, Trophy } from 'lucide-react';

interface MatchTheFollowingData {
    columnA: string[];
    columnB: string[];
    mappings: Array<{ A: string; B: string }>;
}

interface MatchTheFollowingProps {
    data: MatchTheFollowingData;
    disabled?: boolean;
}

export const MatchTheFollowing: React.FC<MatchTheFollowingProps> = ({
    data,
    disabled = false
}) => {
    console.log('🎲 MatchTheFollowing received data:', data);

    const [userMatches, setUserMatches] = useState<{ [key: string]: string }>({});
    const [selectedItemA, setSelectedItemA] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [showResults, setShowResults] = useState(false);

    if (!data || !data.columnA || !data.columnB) {
        console.log('🎲 MatchTheFollowing: No valid data received');
        return (
            <div className="text-center text-muted-foreground">
                No matching exercise data available.
            </div>
        );
    }

    console.log('🎲 MatchTheFollowing: Valid data received, columnA:', data.columnA.length, 'columnB:', data.columnB.length);

    const handleItemAClick = (itemA: string) => {
        if (submitted || disabled) return;
        setSelectedItemA(selectedItemA === itemA ? null : itemA);
    };

    const handleItemBClick = (itemB: string) => {
        if (submitted || disabled || !selectedItemA) return;

        setUserMatches(prev => ({
            ...prev,
            [selectedItemA]: itemB
        }));
        setSelectedItemA(null);
    };

    const removeMatch = (itemA: string) => {
        if (submitted || disabled) return;
        setUserMatches(prev => {
            const newMatches = { ...prev };
            delete newMatches[itemA];
            return newMatches;
        });
    };

    const handleSubmit = () => {
        if (Object.keys(userMatches).length !== data.columnA.length) {
            alert('Please match all items before submitting!');
            return;
        }
        setSubmitted(true);
        setShowResults(true);
    };

    const resetExercise = () => {
        setUserMatches({});
        setSelectedItemA(null);
        setSubmitted(false);
        setShowResults(false);
    };

    const getCorrectAnswer = (itemA: string): string => {
        const mapping = data.mappings.find(m => m.A === itemA);
        return mapping ? mapping.B : '';
    };

    const isCorrectMatch = (itemA: string): boolean => {
        const userAnswer = userMatches[itemA];
        const correctAnswer = getCorrectAnswer(itemA);
        return userAnswer === correctAnswer;
    };

    const calculateScore = (): number => {
        const correct = data.columnA.filter(itemA => isCorrectMatch(itemA)).length;
        return Math.round((correct / data.columnA.length) * 100);
    };

    const allMatched = Object.keys(userMatches).length === data.columnA.length;
    const score = submitted ? calculateScore() : 0;

    return (
        <div className="space-y-4">
            {/* Instructions */}
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                <CardContent className="pt-4">
                    <p className="text-sm">
                        <strong>Instructions:</strong> Click an item from Column A, then click its matching item from Column B.
                        {!submitted && ' Submit your answers when done to see the results.'}
                    </p>
                </CardContent>
            </Card>

            {/* Matching Exercise */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column A */}
                <div>
                    <h3 className="font-semibold text-lg mb-3 text-center">Column A</h3>
                    <div className="space-y-2">
                        {data.columnA.map((item, index) => {
                            const isSelected = selectedItemA === item;
                            const hasMatch = userMatches[item];
                            const isCorrect = submitted ? isCorrectMatch(item) : null;

                            return (
                                <div
                                    key={index}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${disabled || submitted ? 'cursor-not-allowed' : 'cursor-pointer'
                                        } ${isSelected
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                            : hasMatch
                                                ? submitted
                                                    ? isCorrect
                                                        ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                                        : 'border-red-500 bg-red-50 dark:bg-red-950'
                                                    : 'border-gray-300 bg-gray-50 dark:bg-gray-800'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                    onClick={() => handleItemAClick(item)}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">
                                            {String.fromCharCode(65 + index)}. {item}
                                        </span>
                                        {submitted && (
                                            isCorrect ? (
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-600" />
                                            )
                                        )}
                                    </div>
                                    {hasMatch && (
                                        <div className="mt-2 flex items-center justify-between">
                                            <Badge variant={submitted ? (isCorrect ? 'default' : 'destructive') : 'secondary'}>
                                                Matched: {hasMatch}
                                            </Badge>
                                            {!submitted && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeMatch(item);
                                                    }}
                                                    className="h-6 px-2 text-xs"
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                    {submitted && !isCorrect && (
                                        <div className="mt-1 text-xs text-red-600">
                                            Correct: {getCorrectAnswer(item)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Column B */}
                <div>
                    <h3 className="font-semibold text-lg mb-3 text-center">Column B</h3>
                    <div className="space-y-2">
                        {data.columnB.map((item, index) => {
                            const isMatchedByUser = Object.values(userMatches).includes(item);
                            const canSelect = selectedItemA && !isMatchedByUser;

                            return (
                                <div
                                    key={index}
                                    className={`p-3 rounded-lg border transition-all ${disabled || submitted || !selectedItemA
                                        ? 'cursor-not-allowed opacity-60'
                                        : canSelect
                                            ? 'cursor-pointer border-gray-200 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950'
                                            : 'cursor-not-allowed opacity-40'
                                        } ${isMatchedByUser
                                            ? 'border-gray-400 bg-gray-100 dark:bg-gray-700'
                                            : 'border-gray-200'
                                        }`}
                                    onClick={() => handleItemBClick(item)}
                                >
                                    <span className="text-sm">
                                        {index + 1}. {item}
                                    </span>
                                    {isMatchedByUser && (
                                        <Badge variant="secondary" className="ml-2 text-xs">
                                            Matched
                                        </Badge>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
                {!submitted ? (
                    <Button
                        onClick={handleSubmit}
                        disabled={!allMatched || disabled}
                        className="px-6"
                    >
                        Submit Answers
                    </Button>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="flex items-center justify-center space-x-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            <span className="text-lg font-semibold">
                                Score: {score}% ({data.columnA.filter(item => isCorrectMatch(item)).length}/{data.columnA.length})
                            </span>
                        </div>
                        <Button
                            onClick={resetExercise}
                            variant="outline"
                            className="px-6"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                )}
            </div>

            {/* Selected Item Indicator */}
            {selectedItemA && !submitted && (
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                    <CardContent className="pt-3">
                        <p className="text-sm text-center">
                            <strong>Selected:</strong> {selectedItemA} - Now click its match from Column B
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
