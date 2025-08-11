import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Video, FileText, Image, Music, File, X, Upload, Play, Eye, Trash2, Edit, Plus, Search } from 'lucide-react';
import ReactPlayer from 'react-player';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface ContentItem {
  id: string;
  title: string;
  type: 'video' | 'document' | 'image' | 'audio' | 'text';
  url?: string;
  content?: string;
  thumbnail?: string;
  courseId?: string;
  courseName?: string;
  topicId?: string;
  topicName?: string;
  createdAt: string;
  fileSize?: number;
  duration?: number;
}

const ContentUploader: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('library');
  const [contentType, setContentType] = useState<'video' | 'document' | 'image' | 'audio' | 'text'>('video');
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([
    {
      id: '1',
      title: 'Introduction to Quantum Mechanics',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=JzhlfbWBuQ8',
      thumbnail: 'https://img.youtube.com/vi/JzhlfbWBuQ8/maxresdefault.jpg',
      courseId: '1',
      courseName: 'Advanced Physics',
      topicId: '1',
      topicName: 'Quantum Physics',
      createdAt: '2025-01-15T10:00:00Z',
      duration: 1245 // in seconds
    },
    {
      id: '2',
      title: 'Organic Chemistry Reaction Mechanisms',
      type: 'document',
      url: 'https://example.com/documents/organic-chemistry.pdf',
      courseId: '2',
      courseName: 'Organic Chemistry',
      topicId: '2',
      topicName: 'Reaction Mechanisms',
      createdAt: '2025-01-14T09:30:00Z',
      fileSize: 2.4 // in MB
    },
    {
      id: '3',
      title: 'Calculus Formulas Cheat Sheet',
      type: 'image',
      url: 'https://images.pexels.com/photos/6238297/pexels-photo-6238297.jpeg',
      courseId: '3',
      courseName: 'Calculus for JEE',
      topicId: '3',
      topicName: 'Integration Techniques',
      createdAt: '2025-01-13T14:45:00Z'
    },
    {
      id: '4',
      title: 'Understanding Cell Division',
      type: 'text',
      content: `# Cell Division Process
      
Cell division is a process by which a cell divides into two or more cells. There are two types of cell division:

1. **Mitosis**: The process by which a eukaryotic cell divides to produce two identical daughter cells.
2. **Meiosis**: A special type of cell division that reduces the chromosome number by half, creating four haploid cells.

## Phases of Mitosis

1. **Prophase**: Chromatin condenses into chromosomes, nuclear envelope breaks down
2. **Metaphase**: Chromosomes align at the metaphase plate
3. **Anaphase**: Sister chromatids separate and move to opposite poles
4. **Telophase**: Nuclear envelope reforms, chromosomes decondense
5. **Cytokinesis**: Cytoplasm divides, creating two daughter cells`,
      courseId: '4',
      courseName: 'Biology: Human Physiology',
      topicId: '4',
      topicName: 'Cell Biology',
      createdAt: '2025-01-12T11:20:00Z'
    },
    {
      id: '5',
      title: 'Lecture on Coordinate Geometry',
      type: 'audio',
      url: 'https://example.com/audio/coordinate-geometry.mp3',
      courseId: '5',
      courseName: 'Algebra and Coordinate Geometry',
      topicId: '5',
      topicName: 'Coordinate Systems',
      createdAt: '2025-01-11T16:15:00Z',
      duration: 1850 // in seconds
    }
  ]);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setPreviewUrl(URL.createObjectURL(acceptedFiles[0]));
      setTitle(acceptedFiles[0].name.split('.')[0]);
    }
  }, []);

  // Safer accept prop for useDropzone
  const acceptTypes: Record<string, string[]> = {
    video: ['video/*'],
    image: ['image/*'],
    audio: ['audio/*'],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  };

  const accept = contentType === 'text' ? undefined : 
    Object.fromEntries(
      (acceptTypes[contentType] || []).map(type => [type, []])
    );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept,
    maxFiles: 1
  });

  const handleUpload = () => {
    setUploading(true);
    
    // Simulate upload delay
    setTimeout(() => {
      const newContentItem: ContentItem = {
        id: Date.now().toString(),
        title,
        type: contentType,
        createdAt: new Date().toISOString(),
        courseId: selectedCourse || undefined,
        courseName: selectedCourse ? 'Sample Course' : undefined,
        topicId: selectedTopic || undefined,
        topicName: selectedTopic ? 'Sample Topic' : undefined
      };
      
      if (contentType === 'text') {
        newContentItem.content = textContent;
      } else if (contentType === 'video' && !selectedFile) {
        newContentItem.url = videoUrl;
        newContentItem.thumbnail = `https://img.youtube.com/vi/${videoUrl.split('v=')[1]}/maxresdefault.jpg`;
        newContentItem.duration = 600; // Placeholder
      } else if (selectedFile) {
        // In a real app, we would upload to storage and get a URL
        newContentItem.url = previewUrl || '';
        if (contentType === 'document') {
          newContentItem.fileSize = selectedFile.size / (1024 * 1024); // Convert to MB
        } else if (contentType === 'video' || contentType === 'audio') {
          newContentItem.duration = 300; // Placeholder
        }
      }
      
      setContentItems([newContentItem, ...contentItems]);
      setUploading(false);
      resetForm();
      setActiveTab('library');
    }, 1500);
  };

  const resetForm = () => {
    setTitle('');
    setTextContent('');
    setVideoUrl('');
    setSelectedCourse('');
    setSelectedTopic('');
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  const handleDeleteContent = (id: string) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      setContentItems(contentItems.filter(item => item.id !== id));
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const filteredContent = contentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || item.type === filterType;
    const matchesCourse = !filterCourse || item.courseId === filterCourse;
    
    return matchesSearch && matchesType && matchesCourse;
  });

  const getContentTypeIcon = (type: string, size = 5) => {
    switch (type) {
      case 'video': return <Video className={`w-${size} h-${size}`} />;
      case 'document': return <FileText className={`w-${size} h-${size}`} />;
      case 'image': return <Image className={`w-${size} h-${size}`} />;
      case 'audio': return <Music className={`w-${size} h-${size}`} />;
      case 'text': return <FileText className={`w-${size} h-${size}`} />;
      default: return <File className={`w-${size} h-${size}`} />;
    }
  };

  const courses = [
    { id: '1', title: 'Advanced Physics' },
    { id: '2', title: 'Organic Chemistry' },
    { id: '3', title: 'Calculus for JEE' },
    { id: '4', title: 'Biology: Human Physiology' },
    { id: '5', title: 'Algebra and Coordinate Geometry' }
  ];

  const topics = [
    { id: '1', courseId: '1', title: 'Quantum Physics' },
    { id: '2', courseId: '2', title: 'Reaction Mechanisms' },
    { id: '3', courseId: '3', title: 'Integration Techniques' },
    { id: '4', courseId: '4', title: 'Cell Biology' },
    { id: '5', courseId: '5', title: 'Coordinate Systems' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content Library</h2>
          <p className="text-gray-600">Upload and manage educational content</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'library'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Content Library
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'upload'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upload Content
          </button>
        </div>
      </div>

      {activeTab === 'upload' ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Upload New Content</h3>
          
          <div className="space-y-6">
            {/* Content Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { type: 'video', label: 'Video', icon: Video },
                  { type: 'document', label: 'Document', icon: FileText },
                  { type: 'image', label: 'Image', icon: Image },
                  { type: 'audio', label: 'Audio', icon: Music },
                  { type: 'text', label: 'Text Content', icon: FileText }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        setContentType(item.type as any);
                        setPreviewUrl(null);
                        setSelectedFile(null);
                      }}
                      className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-colors ${
                        contentType === item.type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-8 h-8 ${contentType === item.type ? 'text-blue-500' : 'text-gray-500'}`} />
                      <span className={`mt-2 font-medium ${contentType === item.type ? 'text-blue-600' : 'text-gray-700'}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter a descriptive title"
                required
              />
            </div>

            {/* Course and Topic Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <select
                  id="course"
                  value={selectedCourse}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value);
                    setSelectedTopic('');
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
                  Topic
                </label>
                <select
                  id="topic"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  disabled={!selectedCourse}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">Select a topic</option>
                  {topics
                    .filter(topic => topic.courseId === selectedCourse)
                    .map(topic => (
                      <option key={topic.id} value={topic.id}>{topic.title}</option>
                    ))}
                </select>
              </div>
            </div>

            {/* Content Upload Area */}
            {contentType === 'text' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text Content *
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <ReactQuill 
                    theme="snow" 
                    value={textContent} 
                    onChange={setTextContent}
                    className="h-64"
                  />
                </div>
              </div>
            ) : contentType === 'video' && !selectedFile ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Video Source
                  </label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                    >
                      YouTube URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoUrl('')}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
                    >
                      Upload Video
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    YouTube URL *
                  </label>
                  <input
                    type="url"
                    id="videoUrl"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., https://www.youtube.com/watch?v=..."
                    required
                  />
                </div>
                
                {videoUrl && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preview
                    </label>
                    <div className="aspect-video rounded-lg overflow-hidden bg-black">
                      <ReactPlayer
                        url={videoUrl}
                        width="100%"
                        height="100%"
                        controls
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload {contentType.charAt(0).toUpperCase() + contentType.slice(1)} *
                </label>
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  {selectedFile ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        {contentType === 'image' && previewUrl ? (
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="max-h-48 rounded-lg" 
                          />
                        ) : contentType === 'video' && previewUrl ? (
                          <video 
                            src={previewUrl} 
                            controls 
                            className="max-h-48 rounded-lg" 
                          />
                        ) : contentType === 'audio' && previewUrl ? (
                          <audio 
                            src={previewUrl} 
                            controls 
                            className="w-full" 
                          />
                        ) : (
                          getContentTypeIcon(contentType, 12)
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                        className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <p className="text-gray-700">
                        Drag and drop your {contentType} here, or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        {contentType === 'video' && 'Supported formats: MP4, WebM, MOV (max 500MB)'}
                        {contentType === 'document' && 'Supported formats: PDF, DOCX, PPTX (max 50MB)'}
                        {contentType === 'image' && 'Supported formats: JPG, PNG, GIF, SVG (max 10MB)'}
                        {contentType === 'audio' && 'Supported formats: MP3, WAV, OGG (max 50MB)'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={
                  !title || 
                  (contentType === 'text' && !textContent) ||
                  (contentType === 'video' && !selectedFile && !videoUrl) ||
                  (contentType !== 'text' && contentType !== 'video' && !selectedFile) ||
                  uploading
                }
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Content</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Content Library */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search content by title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <label htmlFor="filterType" className="sr-only">
                  Filter by Content Type
                </label>
                <select
                  id="filterType"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="video">Videos</option>
                  <option value="document">Documents</option>
                  <option value="image">Images</option>
                  <option value="audio">Audio</option>
                  <option value="text">Text Content</option>
                </select>

                <label htmlFor="filterCourse" className="sr-only">
                  Filter by Course
                </label>
                <select
                  id="filterCourse"
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Courses</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No content found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || filterType || filterCourse
                    ? 'Try adjusting your search or filters'
                    : 'Get started by uploading your first content'
                  }
                </p>
                {!searchTerm && !filterType && !filterCourse && (
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Upload Your First Content
                  </button>
                )}
              </div>
            ) : (
              filteredContent.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Preview */}
                  <div className="aspect-video bg-gray-100 relative">
                    {item.type === 'video' && item.url ? (
                      <div className="w-full h-full">
                        {item.thumbnail ? (
                          <div className="relative w-full h-full">
                            <img 
                              src={item.thumbnail} 
                              alt={item.title} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-16 h-16 bg-black bg-opacity-60 rounded-full flex items-center justify-center">
                                <Play className="w-8 h-8 text-white" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <ReactPlayer
                            url={item.url}
                            width="100%"
                            height="100%"
                            light={true}
                          />
                        )}
                      </div>
                    ) : item.type === 'image' && item.url ? (
                      <img 
                        src={item.url} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : item.type === 'audio' && item.url ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-16 h-16 text-gray-400" />
                      </div>
                    ) : item.type === 'document' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-16 h-16 text-gray-400" />
                      </div>
                    ) : item.type === 'text' ? (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
                        <FileText className="w-16 h-16 text-blue-400" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <File className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.type === 'video' ? 'bg-red-100 text-red-800' :
                        item.type === 'document' ? 'bg-blue-100 text-blue-800' :
                        item.type === 'image' ? 'bg-green-100 text-green-800' :
                        item.type === 'audio' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        {item.courseName && (
                          <span>{item.courseName}</span>
                        )}
                        {item.topicName && (
                          <>
                            <span>•</span>
                            <span>{item.topicName}</span>
                          </>
                        )}
                      </div>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {item.duration && (
                          <span>{formatDuration(item.duration)}</span>
                        )}
                        {item.fileSize && (
                          <span>{item.fileSize.toFixed(1)} MB</span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Content"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Edit Content"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContent(item.id)}
                          className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Content"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Add Content Card */}
            <div 
              className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setActiveTab('upload')}
            >
              <Plus className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">Add New Content</h3>
              <p className="text-sm text-gray-600 text-center">
                Upload videos, documents, images, or create text content
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContentUploader;