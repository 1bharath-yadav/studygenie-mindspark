import React, { useState, useMemo, useEffect } from 'react';
import { useSaveLearningActivity, useStudent } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, RotateCcw, Trophy } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface QuizComponentProps {
  quizData?: Record<string, any>;
  disabled?: boolean;
  onQuizComplete?: (results: {
    score: number;
    totalQuestions: number;
    timeSpent: number;
    difficulty: string;
  }) => void;
}

export const QuizComponent: React.FC<QuizComponentProps> = ({
  quizData,
  disabled = false,
  onQuizComplete
}) => {
  const saveActivity = useSaveLearningActivity();
  const { data: currentStudent } = useStudent();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Initialize start time when component mounts
  useEffect(() => {
    setStartTime(new Date());
  }, []);

  // Sample quiz questions (fallback)
  const defaultQuestions: Question[] = [
    {
      id: 1,
      question: "What is the derivative of x² with respect to x?",
      options: ["x", "2x", "x²", "2"],
      correctAnswer: 1,
      explanation: "The derivative of x² is 2x using the power rule: d/dx(x^n) = n·x^(n-1)",
      difficulty: "Easy"
    },
    {
      id: 2,
      question: "Which organelle is responsible for photosynthesis?",
      options: ["Mitochondria", "Nucleus", "Chloroplast", "Ribosome"],
      correctAnswer: 2,
      explanation: "Chloroplasts contain chlorophyll and are responsible for photosynthesis in plant cells.",
      difficulty: "Medium"
    },
    {
      id: 3,
      question: "What is the chemical formula for water?",
      options: ["CO₂", "H₂O", "NaCl", "O₂"],
      correctAnswer: 1,
      explanation: "Water consists of two hydrogen atoms and one oxygen atom, hence H₂O.",
      difficulty: "Easy"
    },
    {
      id: 4,
      question: "What is Newton's second law of motion?",
      options: ["F = ma", "E = mc²", "v = d/t", "P = F/A"],
      correctAnswer: 0,
      explanation: "Newton's second law states that Force equals mass times acceleration (F = ma).",
      difficulty: "Medium"
    }
  ];

  // Process quiz data from API or use defaults
  const questions: Question[] = React.useMemo(() => {
    console.log('🧩 QuizComponent processing quizData:', quizData);

    if (quizData && Array.isArray(quizData) && quizData.length > 0) {
      console.log('🧩 Using API quiz data:', quizData.length, 'questions');
      return quizData.map((q: any, index: number) => ({
        id: index + 1,
        question: q.question || `Question ${index + 1}`,
        options: q.options || [],
        correctAnswer: q.options ? q.options.findIndex((opt: string) => opt === q.correct_answer) : 0,
        explanation: q.explanation || 'No explanation provided',
        difficulty: q.difficulty || 'Medium'
      }));
    }

    console.log('🧩 Using default quiz questions');
    return defaultQuestions;
  }, [quizData]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer !== null) {
      if (selectedAnswer === questions[currentQuestion].correctAnswer) {
        setScore(score + 1);
      }
      setShowResult(true);
    }
  };

  const handleContinue = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(30);
    } else {
      setQuizCompleted(true);

      // Calculate time spent and call completion callback
      if (onQuizComplete && startTime) {
        const timeSpent = Math.round((new Date().getTime() - startTime.getTime()) / 1000);
        const avgDifficulty = questions.reduce((acc, q) => {
          const difficultyWeight = q.difficulty === 'Easy' ? 1 : q.difficulty === 'Medium' ? 2 : 3;
          return acc + difficultyWeight;
        }, 0) / questions.length;

        const difficulty = avgDifficulty <= 1.5 ? 'easy' : avgDifficulty <= 2.5 ? 'medium' : 'hard';

        onQuizComplete({
          score,
          totalQuestions: questions.length,
          timeSpent,
          difficulty
        });

        // NOTE: Persistence is handled by the parent component via onQuizComplete
        // (NewStudyInterface). Removing the internal save avoids duplicate
        // POSTs and ensures a single canonical student_id is used.
      }
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setTimeLeft(30);
    setQuizCompleted(false);
    setStartTime(new Date());
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-success';
      case 'Medium': return 'text-warning';
      case 'Hard': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <Card className="glass-effect border-0 max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-primary rounded-full">
              <Trophy className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Quiz Completed!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-4">
            <div className={`text-4xl font-bold ${getScoreColor(percentage)}`}>
              {score}/{questions.length}
            </div>
            <div className="text-xl text-muted-foreground">
              {percentage}% Correct
            </div>
            <Progress value={percentage} className="h-3" />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Questions</div>
              <div className="text-lg font-semibold">{questions.length}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Correct</div>
              <div className="text-lg font-semibold text-success">{score}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Accuracy</div>
              <div className="text-lg font-semibold">{percentage}%</div>
            </div>
          </div>

          <div className="space-y-2">
            <Badge variant={percentage >= 80 ? "default" : percentage >= 60 ? "secondary" : "destructive"}>
              {percentage >= 80 ? "Excellent!" : percentage >= 60 ? "Good Job!" : "Keep Practicing!"}
            </Badge>
          </div>

          <Button onClick={resetQuiz} className="w-full" size="lg">
            <RotateCcw className="h-4 w-4 mr-2" />
            Take Quiz Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <Card className="glass-effect border-0 max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Interactive Quiz</CardTitle>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{timeLeft}s</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <Badge variant="outline" className={getDifficultyColor(currentQ.difficulty)}>
              {currentQ.difficulty}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!showResult ? (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-medium leading-relaxed">
                {currentQ.question}
              </h3>

              <div className="space-y-3">
                {currentQ.options.map((option, index) => (
                  <Button
                    key={index}
                    variant={selectedAnswer === index ? "default" : "outline"}
                    onClick={() => handleAnswerSelect(index)}
                    className="w-full text-left justify-start h-auto p-4 text-wrap"
                  >
                    <span className="mr-3 font-semibold">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleNextQuestion}
              disabled={selectedAnswer === null}
              className="w-full"
              size="lg"
            >
              Submit Answer
            </Button>
          </>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              {selectedAnswer === currentQ.correctAnswer ? (
                <div className="space-y-3">
                  <CheckCircle className="h-12 w-12 text-success mx-auto" />
                  <h3 className="text-xl font-semibold text-success">Correct!</h3>
                </div>
              ) : (
                <div className="space-y-3">
                  <XCircle className="h-12 w-12 text-destructive mx-auto" />
                  <h3 className="text-xl font-semibold text-destructive">Incorrect</h3>
                  <p className="text-sm text-muted-foreground">
                    The correct answer was: <strong>{currentQ.options[currentQ.correctAnswer]}</strong>
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-muted/20 rounded-lg">
              <h4 className="font-medium mb-2">Explanation:</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>

            <Button onClick={handleContinue} className="w-full" size="lg">
              {currentQuestion < questions.length - 1 ? "Next Question" : "Finish Quiz"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};