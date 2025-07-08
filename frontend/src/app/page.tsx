'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Brain, 
  Users, 
  Trophy, 
  Zap, 
  BookOpen, 
  Target, 
  Clock, 
  Sparkles,
  ArrowRight,
  Gamepad2
} from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/auth');
  };

  const handleSignup = () => {
    router.push('/auth?mode=signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Gamepad2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">BrainDuel</h1>
                <p className="text-xs text-gray-400">AI-Powered Learning Battles</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogin}
                className="text-gray-300 hover:text-white font-medium transition-colors"
              >
                Login
              </button>
              <button
                onClick={handleSignup}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-2xl">
                <Brain className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Transform Learning into
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {" "}Epic Battles
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Upload your study materials, generate AI-powered questions, and challenge friends in real-time knowledge battles. 
              Make learning competitive, engaging, and fun!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleSignup}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <span>Start Your First Battle</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogin}
                className="border-2 border-gray-600 text-gray-300 px-8 py-4 rounded-xl font-semibold text-lg hover:border-gray-500 hover:bg-gray-800 transition-all duration-200 flex items-center justify-center"
              >
                I already have an account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose BrainDuel?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience the future of collaborative learning with AI-powered features designed to make studying engaging and effective.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 p-8 rounded-2xl border border-blue-700/50">
              <div className="bg-blue-600 p-3 rounded-xl w-fit mb-6">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                AI-Powered Question Generation
              </h3>
              <p className="text-gray-300">
                Upload your notes, textbooks, or study materials and let our AI create challenging, 
                relevant questions tailored to your content.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 p-8 rounded-2xl border border-purple-700/50">
              <div className="bg-purple-600 p-3 rounded-xl w-fit mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Real-Time Battles
              </h3>
              <p className="text-gray-300">
                Challenge friends or join public battles with real-time competition. 
                Answer questions simultaneously and see who comes out on top!
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-green-900/50 to-green-800/50 p-8 rounded-2xl border border-green-700/50">
              <div className="bg-green-600 p-3 rounded-xl w-fit mb-6">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Competitive Scoring
              </h3>
              <p className="text-gray-300">
                Earn points based on accuracy and speed. Compete for high scores, 
                track your progress, and climb the leaderboards.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/50 p-8 rounded-2xl border border-orange-700/50">
              <div className="bg-orange-600 p-3 rounded-xl w-fit mb-6">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Time-Based Challenges
              </h3>
              <p className="text-gray-300">
                Race against the clock with customizable time limits. 
                Test your knowledge under pressure and improve your quick thinking skills.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-red-900/50 to-red-800/50 p-8 rounded-2xl border border-red-700/50">
              <div className="bg-red-600 p-3 rounded-xl w-fit mb-6">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Personalized Learning
              </h3>
              <p className="text-gray-300">
                Focus on your specific study materials and subjects. 
                Create battles for any topic - from math to history to science.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/50 p-8 rounded-2xl border border-indigo-700/50">
              <div className="bg-indigo-600 p-3 rounded-xl w-fit mb-6">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Instant Feedback
              </h3>
              <p className="text-gray-300">
                Get immediate feedback on your answers with detailed explanations. 
                Learn from mistakes and reinforce correct knowledge.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Get started in just a few simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Upload Your Materials
              </h3>
              <p className="text-gray-300">
                Upload your notes, textbooks, or any study materials. 
                Our AI will analyze and generate questions from your content.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Create or Join a Battle
              </h3>
              <p className="text-gray-300">
                Create a private battle with friends or join a public battle. 
                Set the number of questions and time limits.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Battle & Learn
              </h3>
              <p className="text-gray-300">
                Answer questions in real-time, compete for points, 
                and learn from instant feedback and explanations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of students who are already making learning fun and competitive with BrainDuel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleSignup}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <span>Start Learning Today</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={handleLogin}
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-200 flex items-center justify-center"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Gamepad2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">BrainDuel</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Making learning competitive, engaging, and fun with AI-powered battles.
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
