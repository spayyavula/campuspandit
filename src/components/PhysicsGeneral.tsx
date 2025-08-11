
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

const PhysicsGeneral = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<string[]>([]);
  const [boards, setBoards] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('questions')
        .select('*');
      if (data) {
        setQuestions(data);
        const allTopics = new Set<string>();
        const allBoards = new Set<string>();
        const allDifficulties = new Set<string>();
        const allGrades = new Set<string>();
        const allSubjects = new Set<string>();
        data.forEach((q: any) => {
          if (q.topicTags && Array.isArray(q.topicTags)) {
            q.topicTags.forEach((tag: string) => allTopics.add(tag));
          }
          if (q.board) allBoards.add(q.board);
          if (q.difficulty) allDifficulties.add(q.difficulty);
          if (q.grade) allGrades.add(q.grade);
          if (q.subject) allSubjects.add(q.subject);
        });
        setTopics(Array.from(allTopics));
        setBoards(Array.from(allBoards));
        setDifficulties(Array.from(allDifficulties));
        setGrades(Array.from(allGrades));
        setSubjects(Array.from(allSubjects));
      }
      setLoading(false);
    };
    fetchQuestions();
  }, []);

  const isAnyFilterSet = selectedSubject || selectedBoard || selectedDifficulty || selectedGrade || selectedTopic;
  const filteredQuestions = isAnyFilterSet
    ? questions.filter(q => {
        return (
          (!selectedSubject || q.subject === selectedSubject) &&
          (!selectedBoard || q.board === selectedBoard) &&
          (!selectedDifficulty || q.difficulty === selectedDifficulty) &&
          (!selectedGrade || q.grade === selectedGrade) &&
          (!selectedTopic || (q.topicTags && q.topicTags.includes(selectedTopic)))
        );
      })
    : questions;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Physics (General) - All Questions</h2>
      {/* Filter Bar */}
      <div className="mb-4 flex flex-wrap gap-4 items-end">
        <div>
          <label htmlFor="subject-select" className="block text-sm font-medium mb-1">Subject</label>
          <select id="subject-select" className="border rounded px-2 py-1" value={selectedSubject || ''} onChange={e => setSelectedSubject(e.target.value || null)}>
            <option value="">All</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="board-select" className="block text-sm font-medium mb-1">Board</label>
          <select id="board-select" className="border rounded px-2 py-1" value={selectedBoard || ''} onChange={e => setSelectedBoard(e.target.value || null)}>
            <option value="">All</option>
            {boards.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="difficulty-select" className="block text-sm font-medium mb-1">Difficulty</label>
          <select id="difficulty-select" className="border rounded px-2 py-1" value={selectedDifficulty || ''} onChange={e => setSelectedDifficulty(e.target.value || null)}>
            <option value="">All</option>
            {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="grade-select" className="block text-sm font-medium mb-1">Grade</label>
          <select id="grade-select" className="border rounded px-2 py-1" value={selectedGrade || ''} onChange={e => setSelectedGrade(e.target.value || null)}>
            <option value="">All</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="topic-select" className="block text-sm font-medium mb-1">Topic</label>
          <select id="topic-select" className="border rounded px-2 py-1" value={selectedTopic || ''} onChange={e => setSelectedTopic(e.target.value || null)}>
            <option value="">All</option>
            {topics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button className="ml-2 px-3 py-1 rounded bg-gray-200" onClick={() => {
          setSelectedSubject(null); setSelectedBoard(null); setSelectedDifficulty(null); setSelectedGrade(null); setSelectedTopic(null);
        }}>Clear Filters</button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-xs md:text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">ID</th>
                <th className="border px-2 py-1">Title</th>
                <th className="border px-2 py-1">Content</th>
                <th className="border px-2 py-1">Type</th>
                <th className="border px-2 py-1">Difficulty</th>
                <th className="border px-2 py-1">Subject</th>
                <th className="border px-2 py-1">Board</th>
                <th className="border px-2 py-1">Grade</th>
                <th className="border px-2 py-1">Topic Tags</th>
                <th className="border px-2 py-1">Marks</th>
                <th className="border px-2 py-1">Time Limit</th>
                <th className="border px-2 py-1">Published</th>
                <th className="border px-2 py-1">Created At</th>
                <th className="border px-2 py-1">Updated At</th>
                <th className="border px-2 py-1">Analytics</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((q) => (
                <tr key={q.id}>
                  <td className="border px-2 py-1">{q.id}</td>
                  <td className="border px-2 py-1">{q.title}</td>
                  <td className="border px-2 py-1">{q.content}</td>
                  <td className="border px-2 py-1">{q.questionType}</td>
                  <td className="border px-2 py-1">{q.difficulty}</td>
                  <td className="border px-2 py-1">{q.subject}</td>
                  <td className="border px-2 py-1">{q.board}</td>
                  <td className="border px-2 py-1">{q.grade}</td>
                  <td className="border px-2 py-1">{Array.isArray(q.topicTags) ? q.topicTags.join('; ') : q.topicTags}</td>
                  <td className="border px-2 py-1">{q.marks}</td>
                  <td className="border px-2 py-1">{q.timeLimit}</td>
                  <td className="border px-2 py-1">{q.isPublished ? 'Yes' : 'No'}</td>
                  <td className="border px-2 py-1">{q.createdAt}</td>
                  <td className="border px-2 py-1">{q.updatedAt}</td>
                  <td className="border px-2 py-1">{q.analytics ? JSON.stringify(q.analytics) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PhysicsGeneral;
