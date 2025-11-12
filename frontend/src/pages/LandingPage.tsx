import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Sparkles, Shield, BarChart3, ArrowRight } from 'lucide-react';
import CreateRetroForm from '@/components/CreateRetroForm';
import Header from '@/components/Header';

export default function LandingPage() {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Better Retrospectives,
            <br />
            <span className="text-kone-blue dark:text-kone-lightBlue">Better Teams</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Streamline your agile retrospectives with KONE's internal tool. Collaborate,
            reflect, and improve as a team with powerful features designed for distributed teams.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2"
          >
            Start a Retrospective
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Sparkles className="w-8 h-8" />}
            title="Easy to Use"
            description="Intuitive interface with customizable templates for any team"
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="Anonymous Feedback"
            description="Enable anonymous mode for honest and open feedback"
          />
          <FeatureCard
            icon={<BarChart3 className="w-8 h-8" />}
            title="Analytics"
            description="Track team progress and action items over time"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Real-time Collaboration"
            description="Work together in real-time with voting and grouping"
          />
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="card max-w-4xl mx-auto dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
            Quick Start Guide
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Create Session"
              description="Set up your retro with a name, context, and choose a template"
            />
            <StepCard
              number="2"
              title="Configure Settings"
              description="Enable anonymity, set voting limits, and timer duration"
            />
            <StepCard
              number="3"
              title="Start Collaborating"
              description="Share the link with your team and start the retrospective"
            />
          </div>
        </div>
      </section>

      {/* Create Retro Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
            {/* Fixed Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create New Retrospective</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>
            {/* Content */}
            <div className="pl-6 pb-6 pt-4 pr-2">
              <CreateRetroForm
                onSuccess={(retro) => {
                  setShowCreateForm(false);
                  navigate(`/retro/${retro.id}`);
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t dark:border-gray-700">
        <p className="text-center text-gray-600 dark:text-gray-400">
          © 2025 KONE Corporation. Internal Tool for Agile Teams.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="card text-center hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-kone-blue bg-opacity-10 dark:bg-opacity-20 rounded-full mb-4 text-kone-blue dark:text-kone-lightBlue">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-kone-blue dark:bg-kone-lightBlue text-white rounded-full text-xl font-bold mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}
