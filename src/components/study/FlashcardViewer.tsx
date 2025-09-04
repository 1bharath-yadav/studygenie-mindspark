import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Brain,
  CheckCircle,
  XCircle,
  Star,
  Shuffle
} from 'lucide-react';

interface Flashcard {
  id: number;
  question: string;
  answer: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  subject: string;
  mastered?: boolean;
}

interface FlashcardViewerProps {
  flashcards?: Record<string, any>;
  disabled?: boolean;
}

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({
  flashcards: flashcardsData,
  disabled = false
}) => {
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<number>>(new Set());
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());
  const [reviewCards, setReviewCards] = useState<Set<number>>(new Set());

  // Sample flashcards (fallback if no data provided)
  const defaultFlashcards: Flashcard[] = [
    {
      id: 1,
      question: "What is the fundamental theorem of calculus?",
      answer: "The fundamental theorem of calculus establishes the relationship between differentiation and integration. It states that differentiation and integration are inverse operations.",
      difficulty: "Hard",
      subject: "Mathematics"
    },
    {
      id: 2,
      question: "What is photosynthesis?",
      answer: "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce glucose and oxygen. The general equation is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂",
      difficulty: "Medium",
      subject: "Biology"
    },
    {
      id: 3,
      question: "Define Newton's first law of motion",
      answer: "Newton's first law states that an object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.",
      difficulty: "Easy",
      subject: "Physics"
    },
    {
      id: 4,
      question: "What is the periodic table?",
      answer: "The periodic table is a tabular arrangement of chemical elements, ordered by their atomic number, electron configuration, and recurring chemical properties. Elements in the same column have similar properties.",
      difficulty: "Medium",
      subject: "Chemistry"
    },
    {
      id: 5,
      question: "What is DNA?",
      answer: "DNA (Deoxyribonucleic acid) is a double-stranded molecule that carries genetic information in living organisms. It consists of four bases: Adenine (A), Thymine (T), Guanine (G), and Cytosine (C).",
      difficulty: "Medium",
      subject: "Biology"
    }
  ];

  // Convert provided flashcards data to the expected format or use defaults
  const flashcards: Flashcard[] = React.useMemo(() => {
    if (flashcardsData && typeof flashcardsData === 'object') {
      return Object.entries(flashcardsData).map(([key, card], index) => ({
        id: index + 1,
        question: card.question || `Question ${index + 1}`,
        answer: card.answer || `Answer ${index + 1}`,
        difficulty: card.difficulty || 'Medium',
        subject: 'Study Material'
      }));
    }
    return defaultFlashcards;
  }, [flashcardsData]);

  const currentCardData = flashcards[currentCard];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      setStudiedCards(prev => new Set([...prev, currentCardData.id]));
    }
  };

  const handleNext = () => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(currentCard + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setIsFlipped(false);
    }
  };

  const handleMastered = () => {
    setMasteredCards(prev => new Set([...prev, currentCardData.id]));
    if (reviewCards.has(currentCardData.id)) {
      setReviewCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentCardData.id);
        return newSet;
      });
    }
    handleNext();
  };

  const handleNeedsReview = () => {
    setReviewCards(prev => new Set([...prev, currentCardData.id]));
    if (masteredCards.has(currentCardData.id)) {
      setMasteredCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentCardData.id);
        return newSet;
      });
    }
    handleNext();
  };

  const shuffle = () => {
    const randomIndex = Math.floor(Math.random() * flashcards.length);
    setCurrentCard(randomIndex);
    setIsFlipped(false);
  };

  const resetSession = () => {
    setCurrentCard(0);
    setIsFlipped(false);
    setStudiedCards(new Set());
    setMasteredCards(new Set());
    setReviewCards(new Set());
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-success bg-success/10 border-success/20';
      case 'Medium': return 'text-warning bg-warning/10 border-warning/20';
      case 'Hard': return 'text-destructive bg-destructive/10 border-destructive/20';
      default: return 'text-muted-foreground';
    }
  };

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case 'Mathematics': return 'bg-primary/10 text-primary border-primary/20';
      case 'Physics': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'Chemistry': return 'bg-accent/10 text-accent border-accent/20';
      case 'Biology': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const progress = ((currentCard + 1) / flashcards.length) * 100;
  const studyProgress = (studiedCards.size / flashcards.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-effect border-0">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{currentCard + 1}</div>
            <div className="text-sm text-muted-foreground">of {flashcards.length}</div>
          </CardContent>
        </Card>
        <Card className="glass-effect border-0">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">{masteredCards.size}</div>
            <div className="text-sm text-muted-foreground">Mastered</div>
          </CardContent>
        </Card>
        <Card className="glass-effect border-0">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">{reviewCards.size}</div>
            <div className="text-sm text-muted-foreground">Need Review</div>
          </CardContent>
        </Card>
        <Card className="glass-effect border-0">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">{studiedCards.size}</div>
            <div className="text-sm text-muted-foreground">Studied</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress through deck</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Main Flashcard */}
      <div className="max-w-2xl mx-auto">
        <div
          className="relative h-80 cursor-pointer"
          onClick={handleFlip}
        >
          <Card
            className={`absolute inset-0 glass-effect border-0 transition-all duration-500 transform-gpu ${isFlipped ? 'rotate-y-180' : ''
              }`}
            style={{
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden'
            }}
          >
            <CardContent className="h-full flex flex-col justify-between p-6">
              {!isFlipped ? (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <Badge className={getDifficultyColor(currentCardData.difficulty)}>
                      {currentCardData.difficulty}
                    </Badge>
                    <Badge className={getSubjectColor(currentCardData.subject)}>
                      {currentCardData.subject}
                    </Badge>
                  </div>

                  <div className="flex-1 flex items-center justify-center">
                    <h2 className="text-xl font-medium text-center leading-relaxed">
                      {currentCardData.question}
                    </h2>
                  </div>

                  <div className="flex items-center justify-center text-sm text-muted-foreground">
                    <Brain className="h-4 w-4 mr-2" />
                    Click to reveal answer
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant="outline" className="text-success">
                      Answer
                    </Badge>
                    {masteredCards.has(currentCardData.id) && (
                      <Badge className="bg-success/10 text-success border-success/20">
                        <Star className="h-3 w-3 mr-1" />
                        Mastered
                      </Badge>
                    )}
                    {reviewCards.has(currentCardData.id) && (
                      <Badge className="bg-warning/10 text-warning border-warning/20">
                        Needs Review
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-base text-center leading-relaxed text-muted-foreground">
                      {currentCardData.answer}
                    </p>
                  </div>

                  <div className="text-center text-sm text-muted-foreground">
                    How well did you know this?
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-4">
          {isFlipped && (
            <div className="grid grid-cols-2 gap-4 animate-fade-in">
              <Button
                onClick={handleNeedsReview}
                variant="outline"
                className="h-12 border-warning/20 hover:bg-warning/10"
              >
                <XCircle className="h-4 w-4 mr-2 text-warning" />
                Need Review
              </Button>
              <Button
                onClick={handleMastered}
                variant="outline"
                className="h-12 border-success/20 hover:bg-success/10"
              >
                <CheckCircle className="h-4 w-4 mr-2 text-success" />
                Mastered
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              onClick={handlePrevious}
              disabled={currentCard === 0}
              variant="outline"
              size="lg"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex space-x-2">
              <Button onClick={shuffle} variant="outline" size="sm">
                <Shuffle className="h-4 w-4" />
              </Button>
              <Button onClick={resetSession} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={handleNext}
              disabled={currentCard === flashcards.length - 1}
              variant="outline"
              size="lg"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};