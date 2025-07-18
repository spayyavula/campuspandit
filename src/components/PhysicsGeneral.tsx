import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

interface Question {
  id?: string;
  title: string;
  content: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  subject: string;
  board: string;
  difficulty: string;
  grade: string;
  topic_tags: string[];
  question_type: string;
  marks: number;
  time_limit: number;
}

const PhysicsGeneral: React.FC = () => {
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('subject', 'physics')
        .eq('board', 'general');
      if (data) {
        setQuestions(data);
        // Collect unique topics from topic_tags
        const allTopics = new Set<string>();
        data.forEach((q: any) => {
          if (q.topic_tags && Array.isArray(q.topic_tags)) {
            q.topic_tags.forEach((tag: string) => allTopics.add(tag));
          }
        });
        setTopics(Array.from(allTopics));
      }
      setLoading(false);
    };
    fetchQuestions();
  }, []);

  const filteredQuestions = selectedTopic
    ? questions.filter(q => q.topic_tags && q.topic_tags.includes(selectedTopic))
    : [];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Physics (General) - Topics & MCQs</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Topics</h3>
            <div className="flex flex-wrap gap-2">
              {topics.map(topic => (
                <button
                  key={topic}
                  className={`px-3 py-1 rounded border ${selectedTopic === topic ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  onClick={() => setSelectedTopic(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
          {selectedTopic && (
            <div>
              <h4 className="font-semibold mb-2">Questions for: {selectedTopic}</h4>
              {filteredQuestions.length === 0 ? (
                <div>No questions found for this topic.</div>
              ) : (
                <ul className="space-y-4">
                  {filteredQuestions.map((q, idx) => (
                    <li key={q.id || idx} className="border rounded p-3 bg-white shadow">
                      <div className="font-medium mb-1">{q.title || q.content}</div>
                      <div className="mb-2">{q.content}</div>
                      <ol type="A" className="mb-2">
                        {q.options && q.options.map((opt, i) => (
                          <li key={i} className={q.correct_answer === i ? 'font-bold text-green-700' : ''}>{opt}</li>
                        ))}
                      </ol>
                      <div className="text-sm text-gray-600">Explanation: {q.explanation}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PhysicsGeneral;
