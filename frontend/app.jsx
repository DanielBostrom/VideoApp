import React, { useState, useCallback, useRef } from 'react';
import { Upload, Download, Plus, X, Play, Clock, Scissors, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:8000'; // Adjust to your FastAPI server

const VideoClipCutter = () => {
  const [file, setFile] = useState(null);
  const [timestamps, setTimestamps] = useState([{ start: '', end: '' }]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clips, setClips] = useState([]);
  const [notification, setNotification] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isVideoFile(droppedFile)) {
      setFile(droppedFile);
      showNotification(`Video "${droppedFile.name}" har laddats upp!`, 'success');
    } else {
      showNotification('Endast video-filer (.mp4, .mov, .mkv) stöds!', 'error');
    }
  }, []);

  const isVideoFile = (file) => {
    return file && ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'].includes(file.type);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && isVideoFile(selectedFile)) {
      setFile(selectedFile);
      showNotification(`Video "${selectedFile.name}" har laddats upp!`, 'success');
    } else {
      showNotification('Endast video-filer (.mp4, .mov, .mkv) stöds!', 'error');
    }
  };

  const addTimestamp = () => {
    setTimestamps([...timestamps, { start: '', end: '' }]);
  };

  const removeTimestamp = (index) => {
    if (timestamps.length > 1) {
      setTimestamps(timestamps.filter((_, i) => i !== index));
    }
  };

  const updateTimestamp = (index, field, value) => {
    const updated = [...timestamps];
    updated[index][field] = value;
    setTimestamps(updated);
  };

  const validateTimestamps = () => {
    return timestamps.every(ts => ts.start.trim() && ts.end.trim());
  };

  const createClips = async () => {
    if (!file) {
      showNotification('Välj en video först!', 'error');
      return;
    }

    if (!validateTimestamps()) {
      showNotification('Fyll i alla timestamps!', 'error');
      return;
    }

    setIsProcessing(true);
    setClips([]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const timestampString = timestamps
        .map(ts => `${ts.start.trim()}-${ts.end.trim()}`)
        .join(',');
      formData.append('timestamps', timestampString);

      const response = await fetch(`${API_BASE}/cut`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Något gick fel vid klippning');
      }

      const result = await response.json();
      setClips(result.clips);
      showNotification(`${result.clips.length} klipp skapade!`, 'success');
    } catch (error) {
      showNotification(`Error: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadClip = (filename) => {
    const link = document.createElement('a');
    link.href = `${API_BASE}/download/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Scissors className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Video Clipper</h1>
          </div>
          <p className="text-xl text-gray-300">Bullywug97 personal Shorts maker</p>
          <p className="text-sm text-gray-400 mt-2">Ladda upp → Ange timestamps → Ladda ner klipp</p>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-lg flex items-center gap-3 ${
            notification.type === 'success' ? 'bg-green-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Upload Area */}
        <div className="bg-gray-800 border border-gray-700 rounded-3xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
            <Upload className="w-6 h-6 text-blue-400" />
            Ladda upp video
          </h2>
          
          <div
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
              dragActive 
                ? 'border-blue-400 bg-blue-900/20' 
                : file 
                  ? 'border-green-400 bg-green-900/20' 
                  : 'border-gray-600 hover:border-blue-400 hover:bg-gray-700/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp4,.mov,.mkv"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {file ? (
              <div className="flex flex-col items-center gap-4">
                <Play className="w-16 h-16 text-green-400" />
                <div>
                  <p className="text-lg font-medium text-green-300">{file.name}</p>
                  <p className="text-sm text-green-400">Storlek: {(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-sm text-gray-400 hover:text-red-400 transition-colors"
                >
                  Ta bort och välj ny video
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Upload className="w-16 h-16 text-gray-500" />
                <div>
                  <p className="text-lg font-medium text-gray-300">
                    Dra och släpp din video här
                  </p>
                  <p className="text-sm text-gray-400">
                    eller klicka för att välja (.mp4, .mov, .mkv)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timestamps */}
        <div className="bg-gray-800 border border-gray-700 rounded-3xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-400" />
            Timestamps
          </h2>
          
          <div className="space-y-4">
            {timestamps.map((timestamp, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-700 rounded-2xl">
                <span className="text-sm font-medium text-gray-400 w-8">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  placeholder="0:00"
                  value={timestamp.start}
                  onChange={(e) => updateTimestamp(index, 'start', e.target.value)}
                  className="flex-1 px-4 py-3 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-colors"
                />
                <span className="text-gray-400 font-medium">→</span>
                <input
                  type="text"
                  placeholder="1:00"
                  value={timestamp.end}
                  onChange={(e) => updateTimestamp(index, 'end', e.target.value)}
                  className="flex-1 px-4 py-3 bg-gray-600 border border-gray-500 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-colors"
                />
                {timestamps.length > 1 && (
                  <button
                    onClick={() => removeTimestamp(index)}
                    className="p-2 text-red-400 hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addTimestamp}
            className="mt-4 flex items-center gap-2 px-6 py-3 text-blue-400 hover:bg-blue-900/20 rounded-xl transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Lägg till fler klipp
          </button>

          <div className="mt-6 text-sm text-gray-300 p-4 bg-blue-900/20 border border-blue-800/30 rounded-xl">
            <p className="font-medium mb-2">💡 Tips för timestamps:</p>
            <ul className="space-y-1 text-xs text-gray-400">
              <li>• Använd format som: 1:30, 2:45, 15:20</li>
              <li>• Eller sekunder: 90, 165, 920</li>
              <li>• Exempel: 1:12 → 2:13 skapar ett 61-sekunders klipp</li>
            </ul>
          </div>
        </div>

        {/* Create Button */}
        <div className="text-center mb-8">
          <button
            onClick={createClips}
            disabled={isProcessing || !file}
            className="px-12 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-2xl transition-colors text-lg shadow-xl flex items-center gap-3 mx-auto"
          >
            {isProcessing ? (
              <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Skapar klipp...
              </>
            ) : (
              <>
                <Scissors className="w-6 h-6" />
                Skapa klipp
              </>
            )}
          </button>
        </div>

        {/* Clips List */}
        {clips.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
              <Download className="w-6 h-6 text-green-400" />
              Färdiga klipp ({clips.length})
            </h2>
            
            <div className="grid gap-4">
              {clips.map((clipName, index) => (
                <div key={clipName} className="flex items-center justify-between p-4 bg-green-900/20 border border-green-800/30 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-900/40 rounded-xl flex items-center justify-center">
                      <Play className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-200">Klipp {index + 1}</p>
                      <p className="text-sm text-gray-400">{clipName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadClip(clipName)}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Ladda ner
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoClipCutter;