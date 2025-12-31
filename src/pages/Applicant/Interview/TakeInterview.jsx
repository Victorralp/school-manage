import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../../firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
} from "firebase/firestore";
import { useAuth } from "../../../context/AuthContext";
import Layout from "../../../components/Layout";
import Card from "../../../components/Card";
import Button from "../../../components/Button";
import Alert from "../../../components/Alert";

const TakeInterview = () => {
  const { interviewId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const [alert, setAlert] = useState(null);
  const [hasAlreadyAttempted, setHasAlreadyAttempted] = useState(false);

  useEffect(() => {
    fetchInterviewData();
  }, [interviewId]);

  useEffect(() => {
    if (timerStarted && timeRemaining > 0 && !completed) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timerStarted, timeRemaining, completed]);

  const fetchInterviewData = async () => {
    setLoading(true);
    try {
      // Check if student has already attempted this Interview
      const resultsQuery = query(
        collection(db, "results"),
        where("studentId", "==", user.uid),
        where("interviewId", "==", interviewId),
      );
      const resultsSnapshot = await getDocs(resultsQuery);

      if (!resultsSnapshot.empty) {
        setHasAlreadyAttempted(true);
        const resultData = resultsSnapshot.docs[0].data();
        setScore(resultData.score);
        setCompleted(true);
        setLoading(false);
        return;
      }

      // Fetch Interview details
      const InterviewRef = doc(db, "interviews", interviewId);
      const InterviewSnap = await getDoc(InterviewRef);

      if (InterviewSnap.exists()) {
        const InterviewData = { id: InterviewSnap.id, ...InterviewSnap.data() };
        setInterview(InterviewData);
        setTimeRemaining(InterviewData.timeLimit * 60); // Convert minutes to seconds

        // Fetch questions
        const qSnapshot = await getDocs(
          collection(db, "interviews", interviewId, "questions"),
        );
        const qData = qSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));
        setQuestions(qData);
      } else {
        showAlert("error", "Interview not found");
        navigate("/applicant");
      }
    } catch (error) {
      console.error("Error fetching Interview data:", error);
      showAlert("error", "Failed to load Interview");
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const startInterview = () => {
    setTimerStarted(true);
    showAlert("success", "Interview started! Good luck!");
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleAutoSubmit = async () => {
    showAlert("warning", "Time's up! Submitting your interview...");
    await handleSubmit();
  };

  const handleSubmit = async () => {
    if (!timerStarted) {
      showAlert("error", "Please start the Interview first");
      return;
    }

    if (Object.keys(answers).length === 0) {
      if (
        !window.confirm(
          "You haven't answered any questions. Are you sure you want to submit?",
        )
      ) {
        return;
      }
    }

    setSubmitting(true);

    try {
      // Calculate score
      let correct = 0;
      let objectiveCount = 0;

      questions.forEach((q) => {
        if (!q.type || q.type === 'objective') {
          objectiveCount++;
          if (answers[q.id] !== undefined && parseInt(answers[q.id]) === q.correctOption) {
            correct += 1;
          }
        }
      });

      setScore(correct);

      // Save result to Firestore
      await addDoc(collection(db, "results"), {
        studentId: user.uid,
        interviewId,
        score: correct,
        totalQuestions: questions.length,
        answers: answers,
        timestamp: new Date(),
      });

      setCompleted(true);
      showAlert("success", "Interview submitted successfully!");
    } catch (error) {
      console.error("Error submitting Interview:", error);
      showAlert("error", "Failed to submit interview. Please try again.");
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeColor = () => {
    if (timeRemaining > 300) return "text-green-600";
    if (timeRemaining > 60) return "text-yellow-600";
    return "text-red-600";
  };

  const calculatePercentage = () => {
    return ((score / questions.length) * 100).toFixed(1);
  };

  const isPassed = () => {
    return (score / questions.length) * 100 >= 50;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  if (hasAlreadyAttempted && completed) {
    return (
      <Layout title="Interview Already Attempted">
        <Card className="text-center py-12">
          <svg
            className="mx-auto h-16 w-16 text-yellow-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            You've Already Taken This Interview
          </h2>
          <div className="max-w-md mx-auto mb-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-600 mb-4">Your Score:</p>
              <p
                className={`text-5xl font-bold ${isPassed() ? "text-green-600" : "text-red-600"}`}
              >
                {score}/{questions.length}
              </p>
              <p className="text-gray-600 mt-2">({calculatePercentage()}%)</p>
            </div>
          </div>
          <Button variant="primary" onClick={() => navigate("/applicant")}>
            Back to Dashboard
          </Button>
        </Card>
      </Layout>
    );
  }



  // Helper to check if Interview has theory questions
  const hasTheoryQuestions = questions.some(q => q.type === 'theory');
  const objectiveQuestionsCount = questions.filter(q => !q.type || q.type === 'objective').length;

  if (completed) {
    const passed = isPassed();
    // Calculate percentage based on objective questions only for immediate feedback
    // If mixed, use objective count. If all theory, show 0 or specific message.
    const gradableCount = objectiveQuestionsCount > 0 ? objectiveQuestionsCount : questions.length;
    const percentage = objectiveQuestionsCount > 0 ? ((score / objectiveQuestionsCount) * 100).toFixed(1) : 0;

    return (
      <Layout title="Interview Completed">
        <Card className="text-center py-12">
          <div
            className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-6 ${passed ? "bg-green-100" : "bg-red-100"
              }`}
          >
            {passed ? (
              <svg
                className="h-12 w-12 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="h-12 w-12 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Interview Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-8">
            {hasTheoryQuestions
              ? "Your Interview has been submitted. Objective questions have been graded."
              : (passed ? "Congratulations! You passed the interview." : "Keep practicing. You'll do better next time!")
            }
          </p>

          {hasTheoryQuestions && (
            <Alert
              type="info"
              message="Note: This score reflects your performance on objective questions only. Theory questions are pending manual review."
              className="max-w-2xl mx-auto mb-8"
            />
          )}

          <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Objective Score</p>
              <p className="text-3xl font-bold text-gray-900">
                {score}/{objectiveQuestionsCount}
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Percentage</p>
              <p
                className={`text-3xl font-bold ${parseFloat(percentage) >= 50 ? "text-green-600" : "text-yellow-600"}`}
              >
                {percentage}%
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Result</p>
              <p
                className={`text-3xl font-bold ${parseFloat(percentage) >= 50 ? "text-green-600" : "text-yellow-600"}`}
              >
                {hasTheoryQuestions ? (parseFloat(percentage) >= 50 ? "GOOD START" : "PENDING") : (passed ? "PASSED" : "FAILED")}
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate("/applicant")}
          >
            Back to Dashboard
          </Button>
        </Card>
      </Layout>
    );
  }

  if (!interview) {
    return (
      <Layout>
        <Card className="text-center py-12">
          <p className="text-gray-600">Interview not found</p>
          <Button
            variant="primary"
            onClick={() => navigate("/applicant")}
            className="mt-4"
          >
            Back to Dashboard
          </Button>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title={interview.title}>
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
          className="mb-6"
        />
      )}

      {/* Interview Header */}
      <Card className="mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">{interview.title}</h2>
            <p className="text-blue-100">{interview.subject}</p>
            {interview.description && (
              <p className="text-blue-100 mt-2 text-sm">{interview.description}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Teacher</p>
            <p className="font-semibold">{interview.teacherName || "Unknown"}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-600 bg-opacity-50 px-4 py-2 rounded">
            <p className="text-blue-100 text-xs">Questions</p>
            <p className="font-bold text-lg">{questions.length}</p>
          </div>
          <div className="bg-blue-600 bg-opacity-50 px-4 py-2 rounded">
            <p className="text-blue-100 text-xs">Time Limit</p>
            <p className="font-bold text-lg">{interview.timeLimit} mins</p>
          </div>
          <div className="bg-blue-600 bg-opacity-50 px-4 py-2 rounded">
            <p className="text-blue-100 text-xs">Status</p>
            <p className="font-bold text-lg">
              {timerStarted ? "In Progress" : "Not Started"}
            </p>
          </div>
          <div className="bg-blue-600 bg-opacity-50 px-4 py-2 rounded">
            <p className="text-blue-100 text-xs">Time Remaining</p>
            <p
              className={`font-bold text-lg ${timerStarted ? getTimeColor() : ""}`}
            >
              {timerStarted ? formatTime(timeRemaining) : "--:--"}
            </p>
          </div>
        </div>
      </Card>

      {/* Start Interview Button */}
      {!timerStarted && (
        <Card className="text-center py-8 mb-6">
          <svg
            className="mx-auto h-16 w-16 text-blue-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Ready to Start?
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Once you start the Interview, the timer will begin. You have{" "}
            <strong>{interview.timeLimit} minutes</strong> to complete all{" "}
            <strong>{questions.length} questions</strong>. Make sure you're
            ready before starting.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/applicant")}
            >
              Cancel
            </Button>
            <Button variant="primary" size="lg" onClick={startInterview}>
              Start Interview
            </Button>
          </div>
        </Card>
      )}

      {/* Questions */}
      {timerStarted && (
        <>
          <Card>
            <div className="space-y-8">
              {questions.map((q, index) => (
                <div
                  key={q.id}
                  className="pb-8 border-b border-gray-200 last:border-b-0"
                >
                  <div className="flex items-start mb-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3">
                      {index + 1}
                    </span>
                    <p className="text-lg font-medium text-gray-900 flex-1">
                      {q.questionText}
                    </p>
                  </div>
                  <div className="ml-11 space-y-3">
                    {(!q.type || q.type === 'objective') ? (
                      q.options.map((opt, i) => (
                        <label
                          key={i}
                          className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${answers[q.id] == i
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={i}
                            checked={answers[q.id] == i}
                            onChange={() => handleAnswerChange(q.id, i)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-3 text-gray-900 font-medium">
                            {String.fromCharCode(65 + i)}.
                          </span>
                          <span className="ml-2 text-gray-700">{opt}</span>
                        </label>
                      ))
                    ) : (
                      <div className="mt-2">
                        <textarea
                          rows={6}
                          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
                          placeholder="Type your answer here..."
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        />
                        <div className="text-right text-sm text-gray-500 mt-1">
                          {answers[q.id]?.length || 0} characters
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Submit Section */}
          <Card className="mt-6 bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Progress</p>
                <p className="text-lg font-semibold text-gray-900">
                  {Object.keys(answers).length} of {questions.length} questions
                  answered
                </p>
                <div className="mt-2 w-64 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(Object.keys(answers).length / questions.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                loading={submitting}
              >
                Submit Interview
              </Button>
            </div>
          </Card>
        </>
      )}
    </Layout>
  );
};

export default TakeInterview;

